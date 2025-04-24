
/**
 * iOS Permission Flow State Management
 * 
 * Manages the state of the permission flow process using sessionStorage
 * to provide resilience against page refreshes or navigation.
 */

import { iosPushLogger } from './iosPushLogger';

/**
 * Possible steps in the iOS push notification permission flow
 */
export enum PermissionFlowStep {
  INITIAL = 'initial',
  SERVICE_WORKER_REGISTERED = 'sw-registered',
  PERMISSION_REQUESTED = 'permission-requested',
  PERMISSION_GRANTED = 'permission-granted',
  TOKEN_REQUESTED = 'token-requested',
  COMPLETE = 'complete',
  ERROR = 'error'
}

/**
 * Flow data that may be stored with the step
 */
export interface PermissionFlowData {
  timestamp?: number;
  error?: string;
  iosVersion?: string;
  timings?: {
    flowStart?: number;
    swRegistered?: number;
    permissionRequested?: number;
    permissionGranted?: number;
    tokenRequested?: number;
    completed?: number;
  };
  [key: string]: any;
}

// Storage keys
const FLOW_STEP_KEY = 'ios-push-flow-step';
const FLOW_DATA_KEY = 'ios-push-flow-data';

// Flow timeout (prevent stale state)
const FLOW_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Save the current flow state to sessionStorage
 */
export const saveFlowState = (step: PermissionFlowStep, data?: PermissionFlowData): void => {
  try {
    sessionStorage.setItem(FLOW_STEP_KEY, step);
    
    // Get existing data and merge with new data
    const existingDataStr = sessionStorage.getItem(FLOW_DATA_KEY);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : {};
    const mergedData = { 
      ...existingData, 
      ...data, 
      timestamp: Date.now(),
      lastStep: step
    };
    
    // Update timing information
    if (!mergedData.timings) {
      mergedData.timings = {};
    }
    
    // Record timing for this step
    switch (step) {
      case PermissionFlowStep.INITIAL:
        mergedData.timings.flowStart = Date.now();
        break;
      case PermissionFlowStep.SERVICE_WORKER_REGISTERED:
        mergedData.timings.swRegistered = Date.now();
        break;
      case PermissionFlowStep.PERMISSION_REQUESTED:
        mergedData.timings.permissionRequested = Date.now();
        break;
      case PermissionFlowStep.PERMISSION_GRANTED:
        mergedData.timings.permissionGranted = Date.now();
        break;
      case PermissionFlowStep.TOKEN_REQUESTED:
        mergedData.timings.tokenRequested = Date.now();
        break;
      case PermissionFlowStep.COMPLETE:
        mergedData.timings.completed = Date.now();
        
        // Calculate duration if we have start and end times
        if (mergedData.timings.flowStart) {
          mergedData.duration = mergedData.timings.completed - mergedData.timings.flowStart;
        }
        break;
    }
    
    sessionStorage.setItem(FLOW_DATA_KEY, JSON.stringify(mergedData));
    
    // Log state change for debugging
    iosPushLogger.logPermissionEvent(`flow-state-change-${step}`, mergedData);
  } catch (error) {
    console.error('Error saving flow state:', error);
    // Don't let storage errors break the flow
  }
};

/**
 * Get the current flow state from sessionStorage
 */
export const getFlowState = (): { 
  step: PermissionFlowStep;
  data: PermissionFlowData;
} => {
  try {
    const step = (sessionStorage.getItem(FLOW_STEP_KEY) as PermissionFlowStep) || PermissionFlowStep.INITIAL;
    const dataStr = sessionStorage.getItem(FLOW_DATA_KEY);
    const data = dataStr ? JSON.parse(dataStr) : {};
    return { step, data };
  } catch (error) {
    console.error('Error getting flow state:', error);
    return { step: PermissionFlowStep.INITIAL, data: {} };
  }
};

/**
 * Clear the flow state from sessionStorage
 */
export const clearFlowState = (): void => {
  try {
    // Get current state for logging
    const { step, data } = getFlowState();
    
    // Log the clearing action
    iosPushLogger.logPermissionEvent('flow-state-cleared', {
      previousStep: step,
      data,
      clearTime: Date.now()
    });
    
    // Remove from session storage
    sessionStorage.removeItem(FLOW_STEP_KEY);
    sessionStorage.removeItem(FLOW_DATA_KEY);
  } catch (error) {
    console.error('Error clearing flow state:', error);
  }
};

/**
 * Check if the flow state is stale (too old)
 */
export const isFlowStale = (): boolean => {
  try {
    const { data } = getFlowState();
    const timestamp = data.timestamp || 0;
    
    // Check if the timestamp is too old
    const isStale = Date.now() - timestamp > FLOW_TIMEOUT_MS;
    
    if (isStale) {
      iosPushLogger.logPermissionEvent('flow-state-stale', {
        timestamp,
        currentTime: Date.now(),
        ageMs: Date.now() - timestamp,
        timeoutMs: FLOW_TIMEOUT_MS
      });
    }
    
    return isStale;
  } catch {
    return true;
  }
};

/**
 * Check if the flow should be resumed (if there's a saved state)
 */
export const shouldResumeFlow = (): boolean => {
  try {
    const { step, data } = getFlowState();
    
    // No saved state or in initial/error/complete state
    if (
      step === PermissionFlowStep.INITIAL || 
      step === PermissionFlowStep.ERROR ||
      step === PermissionFlowStep.COMPLETE
    ) {
      return false;
    }
    
    // Check if the saved state is stale
    if (isFlowStale()) {
      clearFlowState();
      return false;
    }
    
    // We have a valid, non-stale state that's in progress
    iosPushLogger.logPermissionEvent('flow-resumable', {
      step,
      lastUpdated: new Date(data.timestamp || 0).toISOString(),
      ageSeconds: (Date.now() - (data.timestamp || 0)) / 1000
    });
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Get flow progress as a percentage
 */
export const getFlowProgress = (): number => {
  try {
    const { step } = getFlowState();
    
    // Map steps to progress percentages
    switch (step) {
      case PermissionFlowStep.INITIAL:
        return 0;
      case PermissionFlowStep.SERVICE_WORKER_REGISTERED:
        return 25;
      case PermissionFlowStep.PERMISSION_REQUESTED:
        return 50;
      case PermissionFlowStep.PERMISSION_GRANTED:
        return 75;
      case PermissionFlowStep.TOKEN_REQUESTED:
        return 90;
      case PermissionFlowStep.COMPLETE:
        return 100;
      case PermissionFlowStep.ERROR:
        return 0;
      default:
        return 0;
    }
  } catch {
    return 0;
  }
};
