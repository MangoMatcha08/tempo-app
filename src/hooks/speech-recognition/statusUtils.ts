
import { RecorderState } from './useVoiceRecorderStateMachine';

/**
 * Type guard to check if a state has a specific status
 */
export const hasStatus = <T extends string>(
  state: { status: string },
  status: T
): state is { status: T } & Record<string, any> => {
  return state.status === status;
};

/**
 * Check if the current state matches a status or array of statuses
 */
export function checkStatus(
  currentStatus: string,
  targetStatus: string | string[]
): boolean {
  if (Array.isArray(targetStatus)) {
    return targetStatus.includes(currentStatus);
  }
  return currentStatus === targetStatus;
}

/**
 * Extract preserved transcript from an error state if available
 */
export function getPreservedTranscript(
  state: RecorderState | { status: string }
): string | null {
  if (
    state.status === 'error' && 
    'preservedTranscript' in state && 
    state.preservedTranscript
  ) {
    return state.preservedTranscript as string; // Added type assertion for safety
  }
  return null;
}

/**
 * Extract error message from an error state if available
 */
export function getErrorMessage(
  state: RecorderState | { status: string }
): string {
  if (state.status === 'error' && 'message' in state) {
    return state.message;
  }
  return '';
}
