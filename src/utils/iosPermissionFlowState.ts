/**
 * iOS Permission Flow State Management
 */

export enum PermissionFlowStep {
  INITIAL = 'initial',
  SERVICE_WORKER_REGISTERED = 'sw-registered',
  PERMISSION_REQUESTED = 'permission-requested',
  PERMISSION_GRANTED = 'permission-granted',
  TOKEN_REQUESTED = 'token-requested',
  COMPLETE = 'complete',
  ERROR = 'error',
  
  // Additional detailed flow steps
  PREPARING_SERVICE_WORKER = 'preparing-sw',
  WAITING_FOR_PERMISSION = 'waiting-for-permission',
  REGISTERING_TOKEN = 'registering-token',
  SAVING_TOKEN = 'saving-token',
  RETRY_IN_PROGRESS = 'retry-in-progress',
  RECOVERING_FROM_ERROR = 'recovering-from-error'
}

interface FlowState {
  step: PermissionFlowStep;
  timestamp: number;
  data?: Record<string, any>;
  // Added for detailed flow tracking
  history?: Array<{
    step: PermissionFlowStep;
    timestamp: number;
    duration?: number;
  }>;
}

const FLOW_STATE_KEY = 'ios-push-flow-state';
const FLOW_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Save the current flow state with history tracking
 */
export function saveFlowState(
  step: PermissionFlowStep, 
  data?: Record<string, any>
): void {
  // Get current state to preserve history
  const current = getFlowState();
  const history = current?.history || [];
  
  // Add previous step to history with duration
  if (current?.step && current.timestamp) {
    history.push({
      step: current.step,
      timestamp: current.timestamp,
      duration: Date.now() - current.timestamp
    });
    
    // Keep history limited to 10 steps
    if (history.length > 10) {
      history.shift();
    }
  }
  
  const state: FlowState = {
    step,
    timestamp: Date.now(),
    data,
    history
  };
  
  localStorage.setItem(FLOW_STATE_KEY, JSON.stringify(state));
}

export function getFlowState(): FlowState | null {
  const stored = localStorage.getItem(FLOW_STATE_KEY);
  if (!stored) return null;
  
  try {
    const state = JSON.parse(stored) as FlowState;
    
    // Check if flow state has expired
    if (Date.now() - state.timestamp > FLOW_TIMEOUT) {
      clearFlowState();
      return null;
    }
    
    return state;
  } catch {
    return null;
  }
}

export function clearFlowState(): void {
  localStorage.removeItem(FLOW_STATE_KEY);
}

export function shouldResumeFlow(): boolean {
  const state = getFlowState();
  if (!state) return false;
  
  return state.step !== PermissionFlowStep.COMPLETE && 
         state.step !== PermissionFlowStep.ERROR;
}

/**
 * Get flow history for debugging and telemetry
 */
export function getFlowHistory(): Array<{
  step: PermissionFlowStep;
  timestamp: number;
  duration?: number;
}> {
  const state = getFlowState();
  if (!state || !state.history) return [];
  
  return state.history;
}

/**
 * Get total flow duration in milliseconds
 */
export function getFlowDuration(): number {
  const state = getFlowState();
  if (!state) return 0;
  
  const startStep = state.history && state.history.length > 0 
    ? state.history[0] 
    : null;
    
  if (!startStep) return 0;
  
  return Date.now() - startStep.timestamp;
}
