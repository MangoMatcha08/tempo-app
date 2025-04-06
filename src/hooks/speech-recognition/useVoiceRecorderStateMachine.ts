
import { useReducer, useCallback, useRef } from 'react';
import { ReminderPriority, ReminderCategory, VoiceProcessingResult } from '@/types/reminderTypes';
import { useTrackedTimeouts } from '@/hooks/use-tracked-timeouts';

// Define all possible state types
export type RecorderState = 
  | { status: 'idle' }
  | { status: 'requesting-permission' }
  | { status: 'recording' }
  | { status: 'recovering' } 
  | { status: 'processing', transcript: string }
  | { status: 'confirming', result: VoiceProcessingResult }
  | { status: 'error', message: string };

// Define all possible events
export type RecorderEvent =
  | { type: 'START_RECORDING' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'STOP_RECORDING', transcript: string }
  | { type: 'RECOVERY_STARTED' } 
  | { type: 'RECOVERY_COMPLETED' } 
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
      if (event.type === 'RECOVERY_STARTED')
        return { status: 'recovering' };
      break;
      
    case 'recovering':
      if (event.type === 'RECOVERY_COMPLETED')
        return { status: 'recording' };
      if (event.type === 'RECOGNITION_ERROR')
        return { status: 'error', message: event.message };
      if (event.type === 'STOP_RECORDING')
        return { status: 'processing', transcript: event.transcript };
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

export interface VoiceRecorderEnvironment {
  isPwa: boolean;
  isIOS: boolean;
  isIOSPwa: boolean;
  isSafari: boolean;
  isMobile: boolean;
}

export const useVoiceRecorderStateMachine = (environment?: VoiceRecorderEnvironment) => {
  const [state, dispatch] = useReducer(voiceRecorderReducer, { status: 'idle' });
  const { createTimeout, clearAllTimeouts } = useTrackedTimeouts();
  
  // Track cleanup actions for better resource management
  const cleanupActionsRef = useRef<Array<() => void>>([]);
  
  // Default environment if not provided
  const env: VoiceRecorderEnvironment = environment || {
    isPwa: false,
    isIOS: false,
    isIOSPwa: false,
    isSafari: false,
    isMobile: false
  };
  
  // Helper to register cleanup actions
  const registerCleanupAction = useCallback((cleanupFn: () => void) => {
    cleanupActionsRef.current.push(cleanupFn);
    return () => {
      cleanupActionsRef.current = cleanupActionsRef.current.filter(fn => fn !== cleanupFn);
    };
  }, []);

  // Helper to apply platform-specific delays  
  const applyPlatformDelay = useCallback((callback: () => void, baseDelay: number = 0) => {
    // iOS PWA needs longer delays for reliable state transitions
    const delayMs = env.isIOSPwa ? baseDelay + 200 : 
                   (env.isPwa ? baseDelay + 100 : 
                   (env.isMobile ? baseDelay + 50 : baseDelay));
    
    if (delayMs > 0) {
      console.log(`[StateMachine] Applying platform delay of ${delayMs}ms (isPwa: ${env.isPwa}, isIOSPwa: ${env.isIOSPwa})`);
      const timeoutId = createTimeout(callback, delayMs);
      
      // Register cleanup for this timeout
      registerCleanupAction(() => {
        clearAllTimeouts(); // This will also clear our specific timeout
        console.log(`[StateMachine] Cleaned up platform delay timeout`);
      });
      
      return timeoutId;
    } else {
      // Execute immediately if no delay needed
      callback();
      return null;
    }
  }, [env.isPwa, env.isIOSPwa, env.isMobile, createTimeout, registerCleanupAction, clearAllTimeouts]);
  
  // Action creators with proper resource management and platform-specific handling
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
    
    recoveryStarted: useCallback(() => {
      dispatch({ type: 'RECOVERY_STARTED' });
    }, []),
    
    recoveryCompleted: useCallback(() => {
      dispatch({ type: 'RECOVERY_COMPLETED' });
    }, []),
    
    recognitionError: useCallback((message: string) => {
      dispatch({ type: 'RECOGNITION_ERROR', message });
    }, []),
    
    processingComplete: useCallback((result: VoiceProcessingResult) => {
      // Use platform-specific delay for the transition to confirming state
      // This helps prevent UI glitches especially in PWA environments
      applyPlatformDelay(() => {
        console.log('[StateMachine] Dispatching PROCESSING_COMPLETE after platform delay');
        dispatch({ type: 'PROCESSING_COMPLETE', result });
      }, env.isIOSPwa ? 300 : 100);
    }, [applyPlatformDelay, env.isIOSPwa]),
    
    processingError: useCallback((message: string) => {
      dispatch({ type: 'PROCESSING_ERROR', message });
      
      // Automatically reset after error displayed
      createTimeout(() => {
        console.log('[StateMachine] Auto-resetting after error');
        clearAllTimeouts();
        dispatch({ type: 'RESET' });
      }, 5000);
    }, [createTimeout, clearAllTimeouts]),
    
    reset: useCallback(() => {
      // Clear any pending timeouts first
      clearAllTimeouts();
      
      // Execute all registered cleanup actions
      cleanupActionsRef.current.forEach(action => {
        try {
          action();
        } catch (err) {
          console.error('Error in cleanup action:', err);
        }
      });
      cleanupActionsRef.current = [];
      
      dispatch({ type: 'RESET' });
      console.log('[StateMachine] Reset complete with full cleanup');
    }, [clearAllTimeouts]),
  };
  
  return { 
    state, 
    actions,
    registerCleanupAction
  };
};
