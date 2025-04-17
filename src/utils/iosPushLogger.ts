
/**
 * iOS Push Notification Logger
 * 
 * Special logging utilities for iOS push notification debug and telemetry
 */
import { browserDetection } from './browserDetection';

// Only enable detailed logging in development or if debug flag is set
const ENABLE_DETAILED_LOGGING = process.env.NODE_ENV === 'development' || 
                              process.env.VITE_DEBUG_IOS_PUSH === 'true';

interface LogEvent {
  timestamp: number;
  category: 'permission' | 'service-worker' | 'token' | 'performance' | 'error' | 'permission-flow' | 'step';
  event: string;
  data?: any;
}

// Keep a log history
let logHistory: LogEvent[] = [];
const MAX_LOG_HISTORY = 100;

// Add clear debug mode accessor
export const isDebugMode = () => 
  process.env.NODE_ENV === 'development' || 
  localStorage.getItem('ios-push-debug') === 'true';

// Record a log event with enhanced context
const recordEvent = (category: LogEvent['category'], event: string, data: any = {}) => {
  // Skip detailed logs in production unless explicitly enabled
  if (!isDebugMode() && category !== 'error') return;
  
  // Add device context automatically
  const enhancedData = {
    ...data,
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: Date.now(),
    // Add iOS-specific information when applicable
    ...(typeof navigator !== 'undefined' && browserDetection.isIOS() && {
      iosVersion: browserDetection.getIOSVersion(),
      isPwa: browserDetection.isIOSPWA(),
      isSafari: browserDetection.isIOSSafari()
    })
  };
  
  // Create log entry
  const logEvent: LogEvent = {
    timestamp: Date.now(),
    category,
    event,
    data: enhancedData
  };
  
  // Add to history
  logHistory.unshift(logEvent);
  
  // Trim history if needed
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory = logHistory.slice(0, MAX_LOG_HISTORY);
  }
  
  // Output to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[iOS Push] [${category}] ${event}`, logEvent.data);
  }
};

// Add structured step logging
export const logPermissionStep = (step: string, details: any = {}) => {
  recordEvent('step', step, {
    ...details,
    timestamp: Date.now(),
    documentVisibility: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
    notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unknown'
  });
  
  // Console output for development
  console.log(`[iOS Push] Step: ${step}`, details);
};

/**
 * Log permission-related events
 */
const logPermissionEvent = (event: string, data?: any) => {
  recordEvent('permission', event, data);
};

/**
 * Log service worker events
 */
const logServiceWorkerEvent = (event: string, data?: any) => {
  recordEvent('service-worker', event, data);
};

/**
 * Log performance events
 */
const logPerformanceEvent = (event: string, data?: any) => {
  recordEvent('performance', event, data);
};

/**
 * Log token-related events
 */
const logPushEvent = (event: string, data?: any) => {
  recordEvent('token', event, data);
};

/**
 * Log error events
 */
const logErrorEvent = (event: string, error: any, additionalData?: any) => {
  recordEvent('error', event, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalData
  });
};

/**
 * Get log history
 */
const getLogHistory = (): LogEvent[] => {
  return [...logHistory];
};

/**
 * Clear log history
 */
const clearLogHistory = (): void => {
  logHistory = [];
};

/**
 * Export formatted logs as JSON
 */
const exportLogs = (): string => {
  return JSON.stringify(logHistory, null, 2);
};

/**
 * Create a performance marker for timing operations
 */
export const measureTiming = (label: string) => {
  const startTime = performance.now();
  return () => {
    const duration = performance.now() - startTime;
    logPerformanceEvent(`timing-${label}`, {
      duration,
      label
    });
    return duration;
  };
};

/**
 * Log memory usage
 */
const logMemoryUsage = () => {
  if (performance && 'memory' in performance) {
    const memory = (performance as any).memory;
    logPerformanceEvent('memory-usage', {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize
    });
  }
};

// Add console warning for debugging to help developers
if (typeof window !== 'undefined' && isDebugMode() && browserDetection.isIOS()) {
  console.warn(
    '[iOS Push] Debug mode enabled for iOS push notifications. ' +
    'This will log detailed information about the permission flow. ' +
    'Disable in production by removing localStorage.setItem("ios-push-debug", "true")'
  );
}

// Export the logger
export const iosPushLogger = {
  logPermissionEvent,
  logServiceWorkerEvent,
  logPushEvent,
  logErrorEvent,
  logPerformanceEvent,
  getLogHistory,
  clearLogHistory,
  exportLogs,
  measureTiming,
  logMemoryUsage,
  logPermissionStep,
  isDebugMode
};

export default iosPushLogger;
