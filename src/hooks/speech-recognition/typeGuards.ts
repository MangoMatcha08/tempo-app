
import { RecorderState } from "@/types/reminderTypes";

// Type guards for the RecorderState discriminated union
export const isRecordingState = (state: RecorderState): state is { status: 'recording' } => 
  state.status === 'recording';

export const isRecoveringState = (state: RecorderState): state is { status: 'recovering' } => 
  state.status === 'recovering';

export const isRecordingOrRecovering = (state: RecorderState): boolean => 
  state.status === 'recording' || state.status === 'recovering';

export const isProcessingState = (state: RecorderState): state is { status: 'processing', transcript: string } => 
  state.status === 'processing';

export const isConfirmingState = (state: RecorderState): state is { status: 'confirming', result: any } => 
  state.status === 'confirming';

export const isErrorState = (state: RecorderState): state is { status: 'error', message: string } => 
  state.status === 'error';

export const isIdleState = (state: RecorderState): state is { status: 'idle' } => 
  state.status === 'idle';

export const isRequestingPermissionState = (state: RecorderState): state is { status: 'requesting-permission' } => 
  state.status === 'requesting-permission';
