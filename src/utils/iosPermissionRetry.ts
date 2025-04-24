/**
 * Retry utilities for iOS permission requests
 */
import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { getFlowState, PermissionFlowStep, saveFlowState } from './iosPermissionFlowState';
import { PermissionErrorType, AttemptHistory } from '../types/notifications/errorTypes';
import { createMetadata } from './telemetryUtils';

// Storage key for attempt history
const ATTEMPT_HISTORY_KEY = 'ios-push-attempt-history';

// Max number of attempts before cooling down
const MAX_ATTEMPTS = 3;

// Minimum time between retry attempts (increases with failed attempts)
const MIN_RETRY_DELAY = 1000;

/**
 * Get the current device capabilities
 */
export function getDeviceCapabilities() {
  return {
    serviceWorkerSupported: 'serviceWorker' in navigator,
    notificationsSupported: 'Notification' in window,
    pushManagerSupported: 'PushManager' in window,
    isIOS: browserDetection.isIOS(),
    iosVersion: browserDetection.getIOSVersion(),
    isPWA: browserDetection.isIOSPWA(),
    isOnline: navigator.onLine,
    connectionType: navigator.connection ? (navigator.connection as any).effectiveType : undefined
  };
}

/**
 * Create error metadata for permission errors
 */
export function createPermissionErrorMetadata(
  errorType: PermissionErrorType, 
  options: { 
    recoverable?: boolean; 
    transient?: boolean;
    additionalData?: Record<string, any>;
  } = {}
) {
  const { recoverable = true, transient = false, additionalData = {} } = options;
  
  // Get the current flow state
  const flowState = getFlowState();
  
  return createMetadata('Permission error', {
    errorType,
    deviceCapabilities: getDeviceCapabilities(),
    attemptHistory: getAttemptHistory(),
    flowStep: flowState?.step,
    recoverable,
    transient,
    ...additionalData
  });
}

/**
 * Get the current attempt history
 */
export function getAttemptHistory(): AttemptHistory {
  try {
    const stored = localStorage.getItem(ATTEMPT_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored) as AttemptHistory;
    }
  } catch (e) {
    // Handle parse error
  }
  
  return {
    count: 0,
    lastAttempt: 0,
    failures: []
  };
}

/**
 * Save attempt history
 */
export function saveAttemptHistory(history: AttemptHistory): void {
  localStorage.setItem(ATTEMPT_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(errorType: PermissionErrorType, errorMessage: string): AttemptHistory {
  const history = getAttemptHistory();
  
  // Update attempt count and timestamp
  history.count++;
  history.lastAttempt = Date.now();
  
  // Add to failures list
  history.failures.push({
    timestamp: Date.now(),
    errorType,
    errorMessage
  });
  
  // Keep only the last 5 failures
  if (history.failures.length > 5) {
    history.failures = history.failures.slice(-5);
  }
  
  // Save the updated history
  saveAttemptHistory(history);
  
  // Log the failed attempt
  iosPushLogger.logPermissionStep('retry-attempt-failed', {
    attemptCount: history.count,
    errorType,
    errorMessage
  });
  
  return history;
}

/**
 * Clear attempt history
 */
export function clearAttemptHistory(): void {
  localStorage.removeItem(ATTEMPT_HISTORY_KEY);
}

/**
 * Check if we should allow a retry attempt
 * @returns {boolean} true if retry is allowed, false if we should cool down
 */
export function shouldAllowRetry(): boolean {
  const history = getAttemptHistory();
  
  // Always allow first attempt
  if (history.count === 0) {
    return true;
  }
  
  // Check if we've hit the max attempts
  if (history.count >= MAX_ATTEMPTS) {
    // If last attempt was more than 24 hours ago, allow retry
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (history.lastAttempt < oneDayAgo) {
      clearAttemptHistory();
      return true;
    }
    
    // Otherwise, enforce cooldown
    return false;
  }
  
  // Calculate delay based on attempt count (exponential backoff)
  const delayNeeded = MIN_RETRY_DELAY * Math.pow(2, history.count - 1);
  const timeElapsed = Date.now() - history.lastAttempt;
  
  return timeElapsed >= delayNeeded;
}

/**
 * Get time until next allowed retry
 * @returns {number} milliseconds until retry is allowed, 0 if retry is allowed now
 */
export function getTimeUntilRetry(): number {
  const history = getAttemptHistory();
  
  // Always allow first attempt
  if (history.count === 0) {
    return 0;
  }
  
  // Check if we've hit the max attempts
  if (history.count >= MAX_ATTEMPTS) {
    // If last attempt was less than 24 hours ago, wait until 24 hours have passed
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (history.lastAttempt >= oneDayAgo) {
      return (history.lastAttempt + (24 * 60 * 60 * 1000)) - Date.now();
    }
    
    return 0;
  }
  
  // Calculate delay based on attempt count (exponential backoff)
  const delayNeeded = MIN_RETRY_DELAY * Math.pow(2, history.count - 1);
  const timeElapsed = Date.now() - history.lastAttempt;
  
  if (timeElapsed >= delayNeeded) {
    return 0;
  }
  
  return delayNeeded - timeElapsed;
}
