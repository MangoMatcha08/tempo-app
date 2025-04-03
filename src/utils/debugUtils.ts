
/**
 * Debug utilities for logging and troubleshooting
 */

/**
 * Log debug information with a consistent prefix
 * @param component Component name for the log
 * @param message Message to log
 * @param data Optional data to include
 */
export const debugLog = (component: string, message: string, data?: any): void => {
  // Only log in development or when debug is enabled
  if (process.env.NODE_ENV === 'development' || localStorage.getItem('debug-enabled') === 'true') {
    console.log(`[${component}] ${message}`, data || '');
  }
};

/**
 * Create a debug logger for a specific component
 * @param componentName Name of the component for logging
 * @returns Logger function
 */
export const createDebugLogger = (componentName: string) => {
  return (message: string, data?: any) => debugLog(componentName, message, data);
};
