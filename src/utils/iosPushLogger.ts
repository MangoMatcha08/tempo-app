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
  category: 'permission' | 'service-worker' | 'token' | 'performance' | 'error';
  event: string;
  data?: any;
}

// Keep a log history
let logHistory: LogEvent[] = [];
const MAX_LOG_HISTORY = 100;

// Record a log event
const recordEvent = (category: LogEvent['category'], event: string, data?: any) => {
  // Skip detailed logs in production unless explicitly enabled
  if (!ENABLE_DETAILED_LOGGING && category !== 'error') return;
  
  // Create log entry
  const logEvent: LogEvent = {
    timestamp: Date.now(),
    category,
    event,
    data: {
      ...data,
      iosVersion: browserDetection.getIOSVersion(),
      isPwa: browserDetection.isIOSPWA()
    }
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
 * Create a performance marker
 */
const createPerformanceMarker = (name: string): () => number => {
  const startTime = performance.now();
  logPerformanceEvent(`${name}-start`, { startTime });
  
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    logPerformanceEvent(`${name}-end`, { startTime, endTime, duration });
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
  createPerformanceMarker,
  logMemoryUsage
};

export default iosPushLogger;
