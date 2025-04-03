
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
  const lastStartAttemptRef = useRef<number>(0);
  
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
  
  // Track if we're trying to start recognition
  const startingRef = useRef<boolean>(false);
  
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
      
      // For all critical errors except "aborted", try to recover
      if (event.error !== 'aborted') {
        debugLog(`Critical error (${event.error}), attempting recovery...`);
        
        // If we're in PWA or mobile mode, try harder to recover
        if (isPWA || isMobile) {
          // Calculate exponential backoff with jitter
          const baseDelay = 300;
          const backoffFactor = Math.min(Math.pow(1.5, attemptCountRef.current), 10);
          const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85 and 1.15
          const backoffTime = Math.min(baseDelay * backoffFactor * jitter, 5000);
          
          debugLog(`Advanced recovery attempt ${attemptCountRef.current + 1}, waiting ${Math.round(backoffTime)}ms`);
          
          // Increment attempt counter before the timeout
          attemptCountRef.current++;
          
          // Set a timeout to try recovery
          setTimeout(() => {
            // Only try recovery if we're still supposed to be listening
            if (isListening) {
              debugLog("Attempting recognition restart after error");
              
              try {
                // First stop any ongoing recognition
                try {
                  recognition.stop();
                  debugLog("Stopped existing recognition for restart");
                } catch (stopErr) {
                  debugLog(`Could not stop existing recognition: ${stopErr}`);
                }
                
                // Add a small delay before restarting
                setTimeout(() => {
                  // Double-check we still want to listen
                  if (isListening) {
                    try {
                      recognition.start();
                      debugLog("Successfully restarted recognition after error");
                      startingRef.current = false;
                    } catch (startErr) {
                      debugLog(`Error on restart: ${startErr}`);
                      
                      // If too many consecutive failures, give up
                      if (attemptCountRef.current >= 3) {
                        setError("Speech recognition failed after multiple attempts. Please try again.");
                        setIsListening(false);
                        startingRef.current = false;
                        attemptCountRef.current = 0;
                      }
                    }
                  }
                }, 500);
              } catch (err) {
                debugLog(`Error in recovery attempt: ${err}`);
                
                // If we've tried too many times, give up
                if (attemptCountRef.current >= 3) {
                  setError("Speech recognition failed after multiple attempts. Please try again.");
                  setIsListening(false);
                  startingRef.current = false;
                  attemptCountRef.current = 0;
                }
              }
            } else {
              // We're no longer trying to listen, so reset attempt counter
              attemptCountRef.current = 0;
              startingRef.current = false;
            }
          }, backoffTime);
        } else {
          // Simpler recovery for desktop
          setError(errorMessages[event.error as keyof typeof errorMessages] || `Speech recognition error: ${event.error}`);
          
          // Stop listening for critical errors on desktop
          if (['not-allowed', 'audio-capture', 'service-not-allowed'].includes(event.error)) {
            setIsListening(false);
            startingRef.current = false;
          }
        }
      }
    };
    
    // Enhanced start event handler
    recognition.onstart = () => {
      debugLog("Recognition started successfully");
      startingRef.current = false;
      setIsListening(true);
    };
    
    // Cleanup
    return () => {
      if (recognition) {
        try {
          recognition.stop();
          debugLog("Recognition stopped during cleanup");
        } catch (err) {
          debugLog(`Error stopping during cleanup: ${err}`);
        }
      }
      
      // Clear any pending timeouts
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
        activeTimeoutRef.current = null;
      }
    };
  }, [recognition, isListening, processSpeechResults, isPWA, isMobile, isIOS]);

  /**
   * Starts the speech recognition process with enhanced mobile handling
   */
  const startListening = useCallback(() => {
    // Prevent rapid repeated calls
    const now = Date.now();
    if (now - lastStartAttemptRef.current < 1000) {
      debugLog("Ignoring start request - too soon after previous attempt");
      return;
    }
    lastStartAttemptRef.current = now;
    
    if (!recognition) {
      console.error("Cannot start listening: recognition not initialized");
      return;
    }
    
    // If already starting or listening, don't try again
    if (startingRef.current || isListening) {
      debugLog("Already starting or listening - ignoring duplicate start request");
      return;
    }
    
    // Mark that we're trying to start
    startingRef.current = true;
    
    // Reset transcript and error state
    resetTranscriptState();
    setError(undefined);
    attemptCountRef.current = 0;
    
    debugLog("Starting speech recognition");
    
    try {
      recognition.start();
      debugLog('Speech recognition start request sent');
      
      // Set a timeout to detect if nothing happens after start
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
      }
      
      const timeoutDuration = getPlatformAdjustedTimeout(10000, { isPWA, isMobile, isIOS });
      
      activeTimeoutRef.current = setTimeout(() => {
        // If we've sent the start request but haven't received confirmation
        if (startingRef.current && !isListening) {
          debugLog("Recognition failed to start after timeout, attempting recovery");
          
          try {
            // Try stopping (might throw if never started)
            try {
              recognition.stop();
              debugLog("Stopped recognition during recovery");
            } catch (stopErr) {
              debugLog(`Error stopping during recovery: ${stopErr}`);
              // Ignore stop errors during recovery
            }
            
            // Give browser a moment to release resources
            setTimeout(() => {
              if (startingRef.current) { // Still trying to start
                try {
                  recognition.start();
                  debugLog("Successfully restarted after no-start timeout");
                } catch (err) {
                  debugLog(`Failed restart after timeout: ${err}`);
                  // If we still can't restart, show error
                  setError("Unable to start speech recognition. Please try again.");
                  setIsListening(false);
                  startingRef.current = false;
                }
              }
            }, 1500);
          } catch (err) {
            debugLog(`Error in no-start recovery: ${err}`);
            setError("Unable to start speech recognition. Please try again.");
            setIsListening(false);
            startingRef.current = false;
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
            if (!startingRef.current) return; // Don't restart if no longer trying to start
            
            recognition.start();
            debugLog("Recognition successfully restarted");
          } catch (startErr) {
            console.error("Second start attempt failed:", startErr);
            debugLog(`Second start attempt failed: ${startErr}`);
            
            // For iOS, which can be problematic, try a third time with longer delay
            if (isIOS) {
              debugLog("iOS detected, trying third restart with longer delay");
              
              setTimeout(() => {
                if (!startingRef.current) return;
                
                try {
                  recognition.start();
                  debugLog("Third start attempt succeeded on iOS");
                } catch (thirdErr) {
                  debugLog(`Third start attempt failed: ${thirdErr}`);
                  setError('Failed to start speech recognition. Please try reloading the page.');
                  setIsListening(false);
                  startingRef.current = false;
                }
              }, 1500);
            } else {
              setError('Failed to start speech recognition. Please try reloading the page.');
              setIsListening(false);
              startingRef.current = false;
            }
          }
        }, delayTime);
      } catch (stopErr) {
        console.error('Failed to restart recognition:', stopErr);
        debugLog(`Failed to restart recognition: ${stopErr}`);
        setError('Failed to start speech recognition. Please try reloading the page.');
        setIsListening(false);
        startingRef.current = false;
      }
    }
  }, [recognition, resetTranscriptState, isPWA, isMobile, isIOS, isListening]);

  /**
   * Stops the speech recognition process with enhanced mobile handling
   */
  const stopListening = useCallback(() => {
    if (!recognition) {
      console.error("Cannot stop listening: recognition not initialized");
      return;
    }
    
    debugLog('Stopping speech recognition');
    startingRef.current = false;
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
