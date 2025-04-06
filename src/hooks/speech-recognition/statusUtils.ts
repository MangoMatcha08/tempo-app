
/**
 * Helper function to safely check if a state status matches one or more expected statuses.
 * This avoids TypeScript's strict literal type checking while maintaining runtime behavior.
 * 
 * @param currentStatus - The current status value to check
 * @param expectedStatus - A single status string or array of status strings to match against
 * @returns boolean - true if the current status matches any of the expected statuses
 */
export function checkStatus(
  currentStatus: any, 
  expectedStatus: string | string[]
): boolean {
  // Convert current status to string for comparison
  const statusStr = String(currentStatus);
  
  // Handle both single string and array cases
  if (Array.isArray(expectedStatus)) {
    return expectedStatus.some(status => String(status) === statusStr);
  }
  
  // Simple string comparison
  return String(expectedStatus) === statusStr;
}

/**
 * Type guard that checks if a state has a specific status.
 * This is useful for narrowing discriminated union types.
 * 
 * @param state - The state object with a status property
 * @param expectedStatus - A single status string or array of status strings to match against
 * @returns boolean - true if the state's status matches any expected status
 */
export function hasStatus<T extends { status: any }>(
  state: T,
  expectedStatus: string | string[]
): boolean {
  return checkStatus(state.status, expectedStatus);
}
