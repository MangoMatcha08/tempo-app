
import { RecorderState, VoiceProcessingResult } from "@/types/reminderTypes";

/**
 * Type guard function to check if state is recording or recovering
 */
export function isRecordingOrRecovering(state: RecorderState): boolean {
  return state.status === 'recording' || state.status === 'recovering';
}

/**
 * Type guard for processing state
 */
export function isProcessingState(state: RecorderState): state is { status: 'processing', transcript: string } {
  return state.status === 'processing';
}

/**
 * Type guard for confirming state
 */
export function isConfirmingState(state: RecorderState): state is { status: 'confirming', result: VoiceProcessingResult } {
  return state.status === 'confirming';
}

/**
 * Type guard for error state
 */
export function isErrorState(state: RecorderState): state is { status: 'error', message: string } {
  return state.status === 'error';
}

/**
 * Type guard for idle state
 */
export function isIdleState(state: RecorderState): state is { status: 'idle' } {
  return state.status === 'idle';
}

/**
 * Type guard for requesting permission state
 */
export function isRequestingPermissionState(state: RecorderState): state is { status: 'requesting-permission' } {
  return state.status === 'requesting-permission';
}
