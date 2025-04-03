
import { useState, useEffect, useCallback, useRef } from 'react';
import { UseSpeechRecognitionReturn } from './types';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { useTranscriptState } from './useTranscriptState';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';
import { getPlatformAdjustedTimeout } from './utils';

const debugLog = createDebugLogger("SpeechRecognition");

/**
 * Custom hook for speech recognition functionality
 * @returns Object containing transcript and speech recognition control methods
 */
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [error, setError] = useState<string | undefined>(undefined);
  const [isListening, setIsListening] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const attemptCountRef = useRef<number>(0);
  const activeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use separate hooks for managing recognition and transcript
  const { 
    recognition, 
    browserSupportsSpeechRecognition, 
    isPWA,
    isIOS 
  } = useSpeechRecognitionSetup({
    onError: setError,
    isListening,
    setIsListening
  });
  
  const { 
    transcript, 
    interimTranscript,
    isProcessing,
    setTranscript, 
    resetTranscriptState, 
    processSpeechResults 
  } = useTranscriptState({ isPWA, isIOS });
  
  // IMPROVEMENT 3: Robust Recognition State Management (continued)
  // Configure recognition event handlers with improved mobile handling
  useEffect(() => {
    if (!recognition) return;
    
    debugLog("Setting up recognition event handlers");
    
    recognition.onresult = (event: any) => {
      debugLog("Recognition result received");
      attemptCountRef.current = 0; // Reset attempt counter on success
      processSpeechResults(event);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      debugLog(`Recognition error: ${event.error}`);
      
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
        debugLog('No speech detected, continuing to listen...');
        return;
      }
      
      // Handle permission errors specially
      if (event.error === 'not-allowed') {
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        setIsListening(false);
        return;
      }
      
      // For network errors, try to restart recognition with special handling
      if (event.error === 'network') {
        debugLog('Network error, attempting to restart recognition...');
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        
        // Attempt to recover with exponential backoff (for mobile network issues)
        const backoffTime = Math.min(1000 * (2 ** attemptCountRef.current), 10000);
        debugLog(`Backoff attempt ${attemptCountRef.current + 1}, waiting ${backoffTime}ms`);
        
        setTimeout(() => {
          if (isListening) {
            try {
              recognition.start();
              debugLog("Recognition restarted after network error");
            } catch (err) {
              console.error('Failed to restart after network error:', err);
              
              // Increment attempt counter
              attemptCountRef.current++;
              
              // Give up after too many attempts
              if (attemptCountRef.current >= 3) {
                setError(`Speech recognition network error. Please try again.`);
                setIsListening(false);
                attemptCountRef.current = 0;
              }
            }
          }
        }, backoffTime);
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
          recognition.stop();
          debugLog("Recognition stopped during cleanup");
        } catch (err) {
          console.error('Error stopping recognition during cleanup:', err);
        }
      }
      
      // Clear any pending timeouts
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
        activeTimeoutRef.current = null;
      }
    };
  }, [recognition, isListening, processSpeechResults]);

  /**
   * Starts the speech recognition process with enhanced mobile handling
   */
  const startListening = useCallback(() => {
    if (!recognition) {
      console.error("Cannot start listening: recognition not initialized");
      return;
    }
    
    // Reset transcript and error state
    resetTranscriptState();
    setError(undefined);
    attemptCountRef.current = 0;
    
    // Update state
    setIsListening(true);
    debugLog("Starting speech recognition");
    
    try {
      recognition.start();
      debugLog('Speech recognition started');
      
      // IMPROVEMENT 5: User Feedback Enhancement
      // Set a timeout to detect if nothing happens after start
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
      }
      
      const timeoutDuration = getPlatformAdjustedTimeout(5000, { isPWA, isMobile, isIOS });
      
      activeTimeoutRef.current = setTimeout(() => {
        // If we haven't received any results after a reasonable time,
        // provide feedback and try restarting
        if (isListening && !transcript && !interimTranscript) {
          debugLog("No speech detected after timeout, attempting restart");
          
          try {
            // Try stopping and restarting
            recognition.stop();
            
            // Give browser a moment to release resources
            setTimeout(() => {
              if (isListening) {
                try {
                  recognition.start();
                  debugLog("Successfully restarted after no-speech timeout");
                } catch (err) {
                  debugLog(`Failed restart after timeout: ${err}`);
                  // If we still can't restart, show error
                  setError("Speech recognition isn't responding. Please try again.");
                  setIsListening(false);
                }
              }
            }, 800);
          } catch (err) {
            debugLog(`Error in no-speech recovery: ${err}`);
          }
        }
        
        activeTimeoutRef.current = null;
      }, timeoutDuration);
      
    } catch (err) {
      // Handle the case where recognition is already started
      console.error('Recognition error on start:', err);
      debugLog(`Recognition error on start: ${err}`);
      
      // Try to stop and restart if already started
      try {
        recognition.stop();
        debugLog("Recognition stopped after error, will attempt restart");
        
        // Use an appropriate platform-specific delay
        const delayTime = getPlatformAdjustedTimeout(500, { isPWA, isMobile, isIOS });
        debugLog(`Setting restart delay of ${delayTime}ms`);
        
        setTimeout(() => {
          try {
            if (!isListening) return; // Don't restart if no longer listening
            
            recognition.start();
            debugLog("Recognition successfully restarted");
          } catch (startErr) {
            console.error("Second start attempt failed:", startErr);
            debugLog(`Second start attempt failed: ${startErr}`);
            
            // For iOS, which can be problematic, try a third time with longer delay
            if (isIOS) {
              debugLog("iOS detected, trying third restart with longer delay");
              
              setTimeout(() => {
                if (!isListening) return;
                
                try {
                  recognition.start();
                  debugLog("Third start attempt succeeded on iOS");
                } catch (thirdErr) {
                  debugLog(`Third start attempt failed: ${thirdErr}`);
                  setError('Failed to start speech recognition. Please try reloading the page.');
                  setIsListening(false);
                }
              }, 1500);
            } else {
              setError('Failed to start speech recognition. Please try reloading the page.');
              setIsListening(false);
            }
          }
        }, delayTime);
      } catch (stopErr) {
        console.error('Failed to restart recognition:', stopErr);
        debugLog(`Failed to restart recognition: ${stopErr}`);
        setError('Failed to start speech recognition. Please try reloading the page.');
        setIsListening(false);
      }
    }
  }, [recognition, resetTranscriptState, isPWA, isMobile, isIOS, isListening, transcript, interimTranscript]);

  /**
   * Stops the speech recognition process with enhanced mobile handling
   */
  const stopListening = useCallback(() => {
    if (!recognition) {
      console.error("Cannot stop listening: recognition not initialized");
      return;
    }
    
    debugLog('Stopping speech recognition');
    setIsListening(false);
    
    // Clear any pending timeouts
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = null;
    }
    
    try {
      recognition.stop();
      debugLog('Speech recognition stopped successfully');
      
      // Platform-specific post-stop actions
      if (isMobile || isPWA) {
        // Give a small delay to ensure final results are captured
        const delayMs = getPlatformAdjustedTimeout(300, { isPWA, isMobile, isIOS });
        
        setTimeout(() => {
          debugLog(`Final transcript after mobile delay: "${transcript}"`);
        }, delayMs);
      }
    } catch (err) {
      console.error('Error stopping recognition:', err);
      debugLog(`Error stopping recognition: ${err}`);
      
      // Even if stopping fails, we consider it stopped from the user's perspective
      setIsListening(false);
    }
  }, [recognition, transcript, isMobile, isPWA, isIOS]);

  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript: resetTranscriptState,
    browserSupportsSpeechRecognition,
    error,
    isPWA,
    isMobile
  };
};

export default useSpeechRecognition;
