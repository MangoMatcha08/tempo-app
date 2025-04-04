
import { useState, useEffect, useCallback, useRef } from 'react';
import { UseSpeechRecognitionReturn } from './types';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { useTranscriptState } from './useTranscriptState';
import { isRunningAsPwa } from './utils';
import { useTrackedTimeouts } from '@/hooks/use-tracked-timeouts';

/**
 * Custom hook for speech recognition functionality
 * @returns Object containing transcript and speech recognition control methods
 */
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [error, setError] = useState<string | undefined>(undefined);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [restartAttempts, setRestartAttempts] = useState(0);
  const [isPwaEnvironment] = useState(() => isRunningAsPwa());
  const isMountedRef = useRef(true);
  const { createTimeout, clearAllTimeouts, clearTrackedTimeout } = useTrackedTimeouts();
  
  // Set mounted flag for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);
  
  // Use separate hooks for managing recognition and transcript
  const { 
    recognition, 
    browserSupportsSpeechRecognition, 
    isPwa,
    environmentConfig 
  } = useSpeechRecognitionSetup({
    onError: setError,
    isListening,
    setIsListening
  });
  
  const { 
    transcript, 
    interimTranscript,
    setTranscript, 
    resetTranscriptState, 
    processSpeechResults 
  } = useTranscriptState();
  
  // Configure recognition event handlers
  useEffect(() => {
    if (!recognition) return;
    
    recognition.onresult = (event: any) => {
      processSpeechResults(event);
      // Reset restart attempts counter on successful results
      setRestartAttempts(0);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error, event);
      
      // Don't update state if component unmounted
      if (!isMountedRef.current) return;
      
      // Map error types to user-friendly messages
      const errorMessages = {
        'not-allowed': 'Microphone access was denied. Please enable microphone access in your browser settings.',
        'audio-capture': 'No microphone was found or microphone is already in use.',
        'network': 'Network error occurred. Please check your internet connection.',
        'aborted': 'Speech recognition was aborted.',
        'no-speech': 'No speech was detected. Please try speaking louder or check your microphone.',
        'service-not-allowed': 'Speech recognition service not allowed. Try reloading the page.',
      };
      
      // Don't stop listening on "no-speech" errors, just log them
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
        return;
      }
      
      // Handle permission errors specially
      if (event.error === 'not-allowed') {
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        setIsListening(false);
        return;
      }
      
      // Special handling for PWA environment - some errors need more recovery time
      if (isPwaEnvironment && ['network', 'service-not-allowed'].includes(event.error)) {
        console.log(`PWA environment detected with ${event.error} error, using extended recovery`);
        
        setError(`Speech recognition error. ${
          restartAttempts > 1 ? 'Multiple errors encountered. ' : ''
        }Please try again in a moment.`);
        
        // Increment restart attempts
        setRestartAttempts(prev => {
          const newCount = prev + 1;
          
          // After 3 attempts, force a longer pause before allowing restart
          if (newCount >= 3) {
            setIsListening(false);
            console.log('Too many restart attempts, stopping recognition');
            
            // Clear error after a delay
            createTimeout(() => {
              setError(undefined);
              setRestartAttempts(0);
            }, 3000);
          }
          
          return newCount;
        });
        
        return;
      }
      
      // For network errors, try to restart recognition
      if (event.error === 'network') {
        console.log('Network error, attempting to restart recognition...');
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        
        // Use progressively longer timeouts for restart attempts
        const timeout = Math.min(1000 * (1 + restartAttempts), 5000);
        console.log(`Will attempt restart in ${timeout}ms (attempt ${restartAttempts + 1})`);
        
        createTimeout(() => {
          if (isListening && isMountedRef.current) {
            try {
              recognition.start();
              // Increment restart attempts
              setRestartAttempts(prev => prev + 1);
            } catch (err) {
              console.error('Failed to restart after network error:', err);
              setError(`Speech recognition network error. Please try again.`);
              setIsListening(false);
            }
          }
        }, timeout);
        return;
      }
      
      // Set user-friendly error message
      setError(errorMessages[event.error as keyof typeof errorMessages] || `Speech recognition error: ${event.error}`);
      
      // Stop listening for critical errors
      if (['not-allowed', 'audio-capture', 'service-not-allowed'].includes(event.error)) {
        setIsListening(false);
      }
    };
    
    // Cleanup
    return () => {
      if (recognition) {
        try {
          // Remove all event handlers first
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;
          
          // Then stop recognition
          recognition.stop();
        } catch (err) {
          console.error('Error stopping recognition during cleanup:', err);
        }
      }
      
      // Clear any pending timeouts
      clearAllTimeouts();
    };
  }, [recognition, isListening, processSpeechResults, isPwaEnvironment, restartAttempts, createTimeout, clearAllTimeouts]);

  // Special handling for iOS PWA environments
  const startIOSPwaRecording = useCallback(() => {
    if (!recognition || !isMountedRef.current) return false;
    
    console.log("Starting iOS PWA specialized recording strategy");
    
    // iOS PWA needs shorter sessions with manual restarts
    const maxSessionLength = 8000; // 8 seconds
    let accumulatedTranscript = '';
    let sessionTimeoutId: number | undefined;
    
    // Configure for iOS limitations
    recognition.continuous = false; // Must be false on iOS
    
    // Create function for iOS session management
    const manageIOSSession = () => {
      if (!isMountedRef.current || !isListening) return;
      
      try {
        recognition.start();
        console.log('Started iOS PWA recognition session');
        
        // Schedule end of session before iOS might kill it
        sessionTimeoutId = createTimeout(() => {
          if (isListening && isMountedRef.current) {
            try {
              // Save current transcript
              accumulatedTranscript += ' ' + transcript;
              
              // Stop current session
              recognition.stop();
              console.log('iOS session stopped, preparing to restart');
              
              // Wait briefly, then start a new session
              createTimeout(() => {
                if (isListening && isMountedRef.current) {
                  manageIOSSession();
                }
              }, 300);
            } catch (err) {
              console.error('Error during iOS session switch:', err);
              
              // Try to recover
              if (isListening && isMountedRef.current) {
                createTimeout(manageIOSSession, 1000);
              }
            }
          }
        }, maxSessionLength);
      } catch (err) {
        console.error('Error in iOS PWA session:', err);
        
        // Try to recover after a delay
        if (isListening && isMountedRef.current) {
          createTimeout(manageIOSSession, 1500);
        }
      }
    };
    
    // Start initial session
    manageIOSSession();
    return true;
  }, [recognition, transcript, isListening, createTimeout]);

  /**
   * Starts the speech recognition process
   */
  const startListening = useCallback(() => {
    if (!recognition || !isMountedRef.current) return;
    
    // Reset transcript and errors
    resetTranscriptState();
    setError(undefined);
    setRestartAttempts(0);
    
    setIsListening(true);
    try {
      // Special handling for iOS PWA
      if (environmentConfig?.isIOSPwa) {
        console.log("Using iOS PWA-specific recognition strategy");
        startIOSPwaRecording();
      } else {
        // Standard recognition start
        recognition.start();
      }
      
      console.log('Speech recognition started');
    } catch (err) {
      // Only handle errors if component is still mounted
      if (!isMountedRef.current) return;
      
      // Handle the case where recognition is already started
      console.error('Recognition error on start:', err);
      
      // Try to stop and restart if already started
      try {
        recognition.stop();
        // Use longer timeout for PWA environments
        const restartDelay = isPwaEnvironment ? 500 : 100;
        console.log(`Attempting restart with ${restartDelay}ms delay (isPwa: ${isPwaEnvironment})`);
        
        createTimeout(() => {
          // Check mounted state before restarting
          if (!isMountedRef.current) return;
          
          try {
            if (environmentConfig?.isIOSPwa) {
              startIOSPwaRecording();
            } else {
              recognition.start();
            }
            console.log('Successfully restarted recognition after stop');
          } catch (innerErr) {
            console.error('Inner restart error:', innerErr);
            setError('Failed to start speech recognition. Please reload the page and try again.');
            setIsListening(false);
          }
        }, restartDelay);
      } catch (stopErr) {
        console.error('Failed to restart recognition:', stopErr);
        setError('Failed to start speech recognition. Please try reloading the page.');
        setIsListening(false);
      }
    }
  }, [recognition, resetTranscriptState, isPwaEnvironment, createTimeout, environmentConfig, startIOSPwaRecording]);

  /**
   * Stops the speech recognition process
   */
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    console.log('Stopping speech recognition');
    setIsListening(false);
    
    try {
      // Reset restart attempts when explicitly stopping
      setRestartAttempts(0);
      
      // First remove event handlers to prevent them from firing during stop
      if (recognition.onend) {
        const originalOnEnd = recognition.onend;
        recognition.onend = null;
        
        // Stop the recognition
        recognition.stop();
        console.log('Speech recognition stopped');
        
        // Restore onend handler after a brief delay
        if (isMountedRef.current) {
          createTimeout(() => {
            if (recognition && isMountedRef.current) {
              recognition.onend = originalOnEnd;
            }
          }, 100);
        }
      } else {
        recognition.stop();
        console.log('Speech recognition stopped');
      }
    } catch (err) {
      console.error('Error stopping recognition:', err);
      
      // Try alternative method for PWA
      if (isPwaEnvironment) {
        try {
          console.log('Attempting abort() as alternative in PWA environment');
          recognition.abort();
        } catch (abortErr) {
          console.error('Abort also failed:', abortErr);
        }
      }
    }
  }, [recognition, isPwaEnvironment, createTimeout]);

  // Add isPwa to return object for UI adaptation
  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript: resetTranscriptState,
    browserSupportsSpeechRecognition,
    error,
    isPwa: isPwaEnvironment
  };
};

export default useSpeechRecognition;
