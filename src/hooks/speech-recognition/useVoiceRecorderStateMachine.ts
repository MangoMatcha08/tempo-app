
import { useReducer, useCallback } from 'react';
import { VoiceProcessingResult } from '@/types/reminderTypes';

// Define all possible state types
export type RecorderState = 
  | { status: 'idle' }
  | { status: 'requesting-permission' }
  | { status: 'recording' }
  | { status: 'processing', transcript: string }
  | { status: 'confirming', result: VoiceProcessingResult }
  | { status: 'error', message: string };

// Define all possible events
export type RecorderEvent =
  | { type: 'START_RECORDING' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'STOP_RECORDING', transcript: string }
  | { type: 'RECOGNITION_ERROR', message: string }
  | { type: 'PROCESSING_COMPLETE', result: VoiceProcessingResult }
  | { type: 'PROCESSING_ERROR', message: string }
  | { type: 'RESET' };

// State machine reducer function
function voiceRecorderReducer(state: RecorderState, event: RecorderEvent): RecorderState {
  console.log(`State transition: ${state.status} + ${event.type}`);
  
  switch (state.status) {
    case 'idle':
      if (event.type === 'START_RECORDING') 
        return { status: 'requesting-permission' };
      break;
      
    case 'requesting-permission':
      if (event.type === 'PERMISSION_GRANTED') 
        return { status: 'recording' };
      if (event.type === 'PERMISSION_DENIED') 
        return { status: 'error', message: 'Microphone access was denied' };
      break;
      
    case 'recording':
      if (event.type === 'STOP_RECORDING') 
        return { status: 'processing', transcript: event.transcript };
      if (event.type === 'RECOGNITION_ERROR') 
        return { status: 'error', message: event.message };
      break;
      
    case 'processing':
      if (event.type === 'PROCESSING_COMPLETE') 
        return { status: 'confirming', result: event.result };
      if (event.type === 'PROCESSING_ERROR') 
        return { status: 'error', message: event.message };
      break;
      
    case 'confirming':
      if (event.type === 'RESET') 
        return { status: 'idle' };
      break;
      
    case 'error':
      if (event.type === 'RESET') 
        return { status: 'idle' };
      break;
  }
  
  return state;
}

/**
 * Custom hook that implements a state machine for voice recorder state management
 * Provides a more predictable state transition flow than multiple useState calls
 */
export function useVoiceRecorderStateMachine() {
  // Initialize with idle state
  const [state, dispatch] = useReducer(voiceRecorderReducer, { status: 'idle' });
  
  // Action creators wrapped in useCallback to maintain reference equality
  const startRecording = useCallback(() => {
    dispatch({ type: 'START_RECORDING' });
  }, []);
  
  const permissionGranted = useCallback(() => {
    dispatch({ type: 'PERMISSION_GRANTED' });
  }, []);
  
  const permissionDenied = useCallback(() => {
    dispatch({ type: 'PERMISSION_DENIED' });
  }, []);
  
  const stopRecording = useCallback((transcript: string) => {
    dispatch({ type: 'STOP_RECORDING', transcript });
  }, []);
  
  const recognitionError = useCallback((message: string) => {
    dispatch({ type: 'RECOGNITION_ERROR', message });
  }, []);
  
  const processingComplete = useCallback((result: VoiceProcessingResult) => {
    dispatch({ type: 'PROCESSING_COMPLETE', result });
  }, []);
  
  const processingError = useCallback((message: string) => {
    dispatch({ type: 'PROCESSING_ERROR', message });
  }, []);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  return {
    state,
    actions: {
      startRecording,
      permissionGranted,
      permissionDenied,
      stopRecording,
      recognitionError,
      processingComplete,
      processingError,
      reset
    }
  };
}

/**
 * Helper function to determine if the state machine view should be in "record" or "confirm" mode
 * Used for backward compatibility with the existing UI components
 */
export function getViewModeFromState(state: RecorderState): "record" | "confirm" {
  switch (state.status) {
    case 'confirming':
      return "confirm";
    case 'idle':
    case 'requesting-permission':
    case 'recording':
    case 'processing':
    case 'error':
    default:
      return "record";
  }
}

/**
 * Helper to check if the recorder is currently in a processing state
 */
export function isProcessingState(state: RecorderState): boolean {
  return state.status === 'processing';
}

/**
 * Creates an initial state representation based on existing component properties
 * Helps with gradual migration to the state machine
 */
export function createInitialState(
  isProcessing?: boolean, 
  processingResult?: VoiceProcessingResult | null
): RecorderState {
  if (processingResult) {
    return { status: 'confirming', result: processingResult };
  }
  
  if (isProcessing) {
    return { status: 'processing', transcript: '' };
  }
  
  return { status: 'idle' };
}
