
/**
 * Date utilities
 * Centralized exports for date handling
 */

// Export core utilities
export * from './core';

// Export types
export * from './types';

// Export feature flag for switching between implementations
export const useDateV2 = true; // Default to new implementation

/**
 * Backward compatibility helper to log usage of deprecated utilities
 */
export function logDeprecated(fnName: string, newFnName: string): void {
  console.warn(`Warning: ${fnName} is deprecated. Use ${newFnName} instead.`);
}
