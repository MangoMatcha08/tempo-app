
import { useReducer, useCallback } from 'react';
import { ReminderPriority, ReminderCategory, VoiceProcessingResult } from '@/types/reminderTypes';
import { useTrackedTimeouts } from '@/hooks/use-tracked-timeouts';

// Define all possible state types
export type RecorderState = 
  | { status: 'idle' }
  | { status: 'requesting-permission' }
  | { status: 'recording', transcript?: string }
  | { status: 'processing', transcript: string }
  | { status: 'confirming', result: VoiceProcessingResult, transcript: string }
  | { status: 'error', message: string, transcript?: string };

// Define all possible events
export type RecorderEvent =
  | { type: 'START_RECORDING' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'STOP_RECORDING', transcript: string }
  | { type: 'RECOGNITION_ERROR', message: string }
  | { type: 'PROCESSING_COMPLETE', result: VoiceProcessingResult }
  | { type: 'PROCESSING_ERROR', message: string }
  | { type: 'UPDATE_TRANSCRIPT', transcript: string }
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
        return { status: 'error', message: event.message, transcript: state.transcript };
      if (event.type === 'UPDATE_TRANSCRIPT')
        return { ...state, transcript: event.transcript };
      break;
      
    case 'processing':
      if (event.type === 'PROCESSING_COMPLETE') 
        return { status: 'confirming', result: event.result, transcript: state.transcript };
      if (event.type === 'PROCESSING_ERROR') 
        return { status: 'error', message: event.message, transcript: state.transcript };
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

export const useVoiceRecorderStateMachine = () => {
  const [state, dispatch] = useReducer(voiceRecorderReducer, { status: 'idle' });
  const { createTimeout } = useTrackedTimeouts();
  
  // Action creators with proper resource management
  const actions = {
    startRecording: useCallback(() => {
      dispatch({ type: 'START_RECORDING' });
    }, []),
    
    permissionGranted: useCallback(() => {
      dispatch({ type: 'PERMISSION_GRANTED' });
    }, []),
    
    permissionDenied: useCallback(() => {
      dispatch({ type: 'PERMISSION_DENIED' });
    }, []),
    
    stopRecording: useCallback((transcript: string) => {
      dispatch({ type: 'STOP_RECORDING', transcript });
    }, []),
    
    updateTranscript: useCallback((transcript: string) => {
      dispatch({ type: 'UPDATE_TRANSCRIPT', transcript });
    }, []),
    
    recognitionError: useCallback((message: string) => {
      dispatch({ type: 'RECOGNITION_ERROR', message });
    }, []),
    
    processingComplete: useCallback((result: VoiceProcessingResult) => {
      dispatch({ type: 'PROCESSING_COMPLETE', result });
    }, []),
    
    processingError: useCallback((message: string) => {
      dispatch({ type: 'PROCESSING_ERROR', message });
      
      // Automatically reset after error displayed
      createTimeout(() => {
        dispatch({ type: 'RESET' });
      }, 5000);
    }, [createTimeout]),
    
    reset: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, []),
  };
  
  return { state, actions };
};
