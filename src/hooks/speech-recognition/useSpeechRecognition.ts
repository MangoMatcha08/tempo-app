import { useState, useRef, useEffect, useCallback } from 'react';
import { UseSpeechRecognitionReturn, SpeechRecognitionOptions } from './types';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { useTranscriptState } from './useTranscriptState';
import { 
  isPwaMode, 
  isIOSDevice, 
  isMobileDevice, 
  ensureActiveAudioStream, 
  releaseAudioStream,
  diagnoseAudioContext
} from './utils';
import { createDebugLogger } from '@/utils/debugUtils';

// Set up debug logger
const debugLog = createDebugLogger("SpeechRecognition");

// Default options
const defaultOptions: SpeechRecognitionOptions = {
  isPWA: false,
  isMobile: false,
  isIOS: false,
  isHighLatency: false
};

/**
 * Custom hook for speech recognition functionality
 */
const useSpeechRecognition = (options?: SpeechRecognitionOptions): UseSpeechRecognitionReturn => {
  // Auto-detect options if not provided
  const detectedIsPWA = options?.isPWA ?? isPwaMode();
  const detectedIsIOS = options?.isIOS ?? isIOSDevice();
  const detectedIsMobile = options?.isMobile ?? isMobileDevice();
  
  // State for tracking speech recognition status
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Refs for tracking internal state
  const manuallyStoppedRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const recognitionStabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionKeepAliveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const continuousRecognitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRecognitionEventRef = useRef<number>(Date.now());
  const unexpectedStopsCountRef = useRef<number>(0);
  const recoveryModeRef = useRef<boolean>(false);
  const isInitializing = useRef<boolean>(false);
  const restartInProgressRef = useRef<boolean>(false);
  const noActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add a silence detection counter
  const silenceCountRef = useRef<number>(0);
  const lastActivityTimestampRef = useRef<number>(Date.now());
  
  // Set up recognition
  const { recognition, browserSupportsSpeechRecognition, isPWA, isIOS } = useSpeechRecognitionSetup({
    onError: setError,
    isListening,
    setIsListening
  });
  
  // Transcript state management
  const {
    transcript,
    interimTranscript,
    resetTranscriptState,
    setTranscript,
    processSpeechResults
  } = useTranscriptState({ isPWA: detectedIsPWA, isIOS: detectedIsIOS });
  
  // Define startKeepAliveTimer first since it's referenced by restartRecognition later
  const startKeepAliveTimer = useCallback(() => {
    if (recognitionKeepAliveTimerRef.current) {
      clearInterval(recognitionKeepAliveTimerRef.current);
      recognitionKeepAliveTimerRef.current = null;
    }
    
    // Check more frequently (every 2 seconds) if recognition is still active
    recognitionKeepAliveTimerRef.current = setInterval(() => {
      if (isListening && !manuallyStoppedRef.current) {
        const now = Date.now();
        const timeSinceLastEvent = now - lastRecognitionEventRef.current;
        
        // If it's been more than 6 seconds since the last event, consider it inactive
        if (timeSinceLastEvent > 6000) {
          debugLog(`No recognition events for ${timeSinceLastEvent}ms, attempting restart`);
          
          // Only attempt restart if we're not already in the process of restarting
          if (!restartInProgressRef.current) {
            debugLog("Triggering restart from keep-alive timer");
            
            // Before trying to restart, check audio functionality
            ensureActiveAudioStream().then(audioAvailable => {
              if (audioAvailable) {
                restartRecognition("keep-alive timeout");
              } else {
                debugLog("Audio stream not available, cannot restart recognition");
                diagnoseAudioContext().then(audioDiagnostic => {
                  debugLog(`Audio diagnostic result: ${audioDiagnostic}`);
                  if (audioDiagnostic) {
                    // Audio seems to work, try restart anyway
                    restartRecognition("keep-alive timeout with audio diagnostic");
                  }
                });
              }
            });
          }
        }
      } else {
        // Stop the timer if we're not listening anymore
        if (recognitionKeepAliveTimerRef.current) {
          clearInterval(recognitionKeepAliveTimerRef.current);
          recognitionKeepAliveTimerRef.current = null;
        }
      }
    }, 1500); // Reduced from 2000ms to 1500ms for faster detection
    
    return () => {
      if (recognitionKeepAliveTimerRef.current) {
        clearInterval(recognitionKeepAliveTimerRef.current);
        recognitionKeepAliveTimerRef.current = null;
      }
    };
  }, [isListening]); // restartRecognition will be added later
  
  // Restart recognition to prevent premature endings
  const restartRecognition = useCallback(async (reason: string) => {
    // Prevent multiple simultaneous restarts
    if (restartInProgressRef.current) {
      debugLog(`Restart already in progress, skipping restart due to: ${reason}`);
      return;
    }
    
    restartInProgressRef.current = true;
    debugLog(`Attempting to restart recognition (reason: ${reason})`);
    
    // Increment unexpected stops count if this was triggered by an unexpected stop
    if (reason === "unexpected stop") {
      unexpectedStopsCountRef.current += 1;
      debugLog(`Unexpected stop count: ${unexpectedStopsCountRef.current}`);
    }
    
    try {
      // Only try to stop if we have a recognition object
      if (recognition) {
        try {
          recognition.stop();
          debugLog("Stopped recognition before restart");
        } catch (err) {
          debugLog(`Error stopping recognition: ${err}`);
          // Continue with restart even if stop fails
        }
      }
      
      // Short delay to ensure clean restart
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reset flags and update state
      lastRecognitionEventRef.current = Date.now();
      lastActivityTimestampRef.current = Date.now();
      silenceCountRef.current = 0;
      
      // Ensure we have audio access before restarting
      const audioAvailable = await ensureActiveAudioStream();
      if (!audioAvailable) {
        debugLog("Cannot restart recognition: audio stream not available");
        
        // Try to diagnose audio
        const audioDiagnostic = await diagnoseAudioContext();
        debugLog(`Audio diagnostic result: ${audioDiagnostic}`);
        
        if (!audioDiagnostic) {
          debugLog("Audio diagnostic failed, cannot restart recognition");
          setError("Could not access microphone. Please check your browser settings.");
          setIsListening(false);
          restartInProgressRef.current = false;
          return;
        }
      }
      
      // Only try to start if we still want to be listening
      if (isListening && !manuallyStoppedRef.current) {
        try {
          // For iOS, sometimes we need to completely recreate the recognition object
          if (isIOS && unexpectedStopsCountRef.current > 2) {
            debugLog("iOS device with multiple failures - forcing full re-initialization");
            
            // Create a new recognition instance
            if (window.webkitSpeechRecognition) {
              const newRecognition = new window.webkitSpeechRecognition();
              newRecognition.continuous = true;
              newRecognition.interimResults = true;
              newRecognition.lang = navigator.language || 'en-US';
              
              // Replace the existing recognition instance
              recognitionRef.current = newRecognition;
              
              // Set up the handlers again
              setupRecognitionHandlers(newRecognition);
            }
          }
          
          if (recognition || recognitionRef.current) {
            const recognitionObj = recognition || recognitionRef.current;
            recognitionObj.start();
            debugLog("Restarted recognition after interruption");
            
            // Restart the keep-alive timer
            startKeepAliveTimer();
            
            // Restart the continuous recognition timer
            startContinuousRecognitionTimer();
            
            // Make sure our state reflects that we're listening
            if (!isListening) {
              setIsListening(true);
            }
          } else {
            debugLog("Failed to restart: no recognition object available");
            setError("Failed to restart speech recognition");
            setIsListening(false);
          }
        } catch (err) {
          debugLog(`Error restarting recognition: ${err}`);
          setError(`Failed to restart: ${err}`);
          
          // If we repeatedly fail to restart, set listening to false
          if (unexpectedStopsCountRef.current > 3) {
            debugLog("Too many restart failures, stopping recognition");
            setIsListening(false);
          } else {
            // Try again after a longer delay
            debugLog("Scheduling another restart attempt");
            recognitionRetryTimerRef.current = setTimeout(() => {
              restartRecognition("retry after failure");
            }, 2000);
          }
        }
      } else {
        debugLog("Not restarting because listening is now false or manually stopped");
      }
    } finally {
      restartInProgressRef.current = false;
    }
  }, [isListening, isIOS, recognition, startKeepAliveTimer]);
  
  // Start continuous recognition timer to periodically restart recognition
  const startContinuousRecognitionTimer = useCallback(() => {
    // Clear any existing timer
    if (continuousRecognitionTimerRef.current) {
      clearTimeout(continuousRecognitionTimerRef.current);
      continuousRecognitionTimerRef.current = null;
    }
    
    // Only set up timer if we're actively listening
    if (isListening && !manuallyStoppedRef.current) {
      // Restart recognition every 45-60 seconds to prevent disconnections
      // This is especially important for long dictations
      const restartInterval = Math.floor(Math.random() * 15000) + 45000; // 45-60 seconds
      
      continuousRecognitionTimerRef.current = setTimeout(() => {
        if (isListening && !manuallyStoppedRef.current) {
          debugLog(`Continuous recognition timer triggered after ${restartInterval}ms`);
          
          // Only restart if we're not already in the process of restarting
          if (!restartInProgressRef.current) {
            restartRecognition("continuous timer");
          }
        }
        continuousRecognitionTimerRef.current = null;
      }, restartInterval);
    }
    
    return () => {
      if (continuousRecognitionTimerRef.current) {
        clearTimeout(continuousRecognitionTimerRef.current);
        continuousRecognitionTimerRef.current = null;
      }
    };
  }, [isListening, restartRecognition]);
  
  // Helper to stabilize recognition status with improved diagnostics
  const stabilizeRecognitionStatus = useCallback(() => {
    if (recognitionStabilityTimerRef.current) {
      clearTimeout(recognitionStabilityTimerRef.current);
    }
    
    // Check that everything is in a consistent state
    recognitionStabilityTimerRef.current = setTimeout(() => {
      if (isListening) {
        if (recognition) {
          try {
            // If we think we're listening but recognition isn't active,
            // try to restart
            debugLog("Performing stability check");
            
            // Update the last event timestamp so we don't trigger keep-alive at the same time
            lastRecognitionEventRef.current = Date.now();
            lastActivityTimestampRef.current = Date.now();
            
            // Restart the timers
            startKeepAliveTimer();
            startContinuousRecognitionTimer();
          } catch (err) {
            debugLog(`Error in stability check: ${err}`);
          }
        } else {
          debugLog("Recognition object not available during stability check");
        }
      }
      
      recognitionStabilityTimerRef.current = null;
    }, 2000);
    
    return () => {
      if (recognitionStabilityTimerRef.current) {
        clearTimeout(recognitionStabilityTimerRef.current);
        recognitionStabilityTimerRef.current = null;
      }
    };
  }, [isListening, recognition, startKeepAliveTimer, startContinuousRecognitionTimer]);
  
  // Start a timer to detect long periods of silence/no activity
  const startNoActivityTimer = useCallback(() => {
    if (noActivityTimeoutRef.current) {
      clearTimeout(noActivityTimeoutRef.current);
      noActivityTimeoutRef.current = null;
    }
    
    if (isListening && !manuallyStoppedRef.current) {
      noActivityTimeoutRef.current = setTimeout(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTimestampRef.current;
        
        // If there's been no activity for 10 seconds, increment the counter
        if (timeSinceLastActivity > 10000) {
          debugLog(`No speech activity for ${timeSinceLastActivity}ms`);
          silenceCountRef.current += 1;
          
          // If we've had 3 consecutive silence checks, try restarting
          if (silenceCountRef.current >= 3 && !restartInProgressRef.current) {
            debugLog("Extended silence detected, attempting restart");
            restartRecognition("no speech activity");
          }
        } else {
          silenceCountRef.current = 0;
        }
        
        // Restart the timer
        startNoActivityTimer();
      }, 10000);
    }
    
    return () => {
      if (noActivityTimeoutRef.current) {
        clearTimeout(noActivityTimeoutRef.current);
        noActivityTimeoutRef.current = null;
      }
    };
  }, [isListening, restartRecognition]);

  // Set up recognition event handlers
  const setupRecognitionHandlers = useCallback((recognitionInstance: any) => {
    if (!recognitionInstance) {
      debugLog("Cannot set up handlers: recognition instance is null");
      return;
    }
    
    // Clear any existing handlers first
    recognitionInstance.onresult = null;
    recognitionInstance.onstart = null;
    recognitionInstance.onend = null;
    recognitionInstance.onerror = null;
    recognitionInstance.onaudiostart = null;
    recognitionInstance.onaudioend = null;
    recognitionInstance.onspeechstart = null;
    recognitionInstance.onspeechend = null;
    
    // Set up the result handler
    recognitionInstance.onresult = (event: any) => {
      // Update the last event timestamp
      lastRecognitionEventRef.current = Date.now();
      lastActivityTimestampRef.current = Date.now();
      silenceCountRef.current = 0;
      
      // Process the speech results
      processSpeechResults(event);
    };
    
    // Set up the start handler
    recognitionInstance.onstart = () => {
      debugLog("Recognition started");
      lastRecognitionEventRef.current = Date.now();
      lastActivityTimestampRef.current = Date.now();
      silenceCountRef.current = 0;
      
      setIsListening(true);
      isInitializing.current = false;
      
      // Start timers
      startKeepAliveTimer();
      startContinuousRecognitionTimer();
      startNoActivityTimer();
      stabilizeRecognitionStatus();
    };
    
    // Set up the end handler
    recognitionInstance.onend = () => {
      debugLog("Recognition ended");
      
      // Check if we manually stopped
      if (manuallyStoppedRef.current) {
        debugLog("Recognition manually stopped, not restarting");
        setIsListening(false);
        manuallyStoppedRef.current = false;
        return;
      }
      
      // If we're still supposed to be listening but recognition ended,
      // this is an unexpected stop
      if (isListening && !restartInProgressRef.current) {
        debugLog("Recognition ended unexpectedly");
        restartRecognition("unexpected stop");
      } else {
        debugLog("Recognition ended normally");
        // Make sure our state reflects that we're not listening
        setIsListening(false);
      }
    };
    
    // Set up the error handler
    recognitionInstance.onerror = (event: any) => {
      debugLog(`Recognition error: ${event.error}`);
      lastRecognitionEventRef.current = Date.now();
      
      // Only set error for non-recoverable errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Recognition error: ${event.error}`);
        
        if (event.error === 'network') {
          debugLog("Network error detected, will attempt recovery");
          recoveryModeRef.current = true;
          
          // For network errors, attempt recovery after a delay
          if (isListening && !restartInProgressRef.current) {
            recognitionRetryTimerRef.current = setTimeout(() => {
              restartRecognition("network error recovery");
            }, 3000);
          }
        }
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          debugLog("Permission error, stopping recognition");
          setIsListening(false);
          manuallyStoppedRef.current = true;
        }
      } else if (event.error === 'no-speech') {
        // Update last activity for no-speech errors too
        lastActivityTimestampRef.current = Date.now();
      }
    };
    
    // Set up other diagnostic handlers
    recognitionInstance.onaudiostart = () => {
      debugLog("Audio capture started");
      lastRecognitionEventRef.current = Date.now();
      lastActivityTimestampRef.current = Date.now();
    };
    
    recognitionInstance.onaudioend = () => {
      debugLog("Audio capture ended");
    };
    
    recognitionInstance.onspeechstart = () => {
      debugLog("Speech started");
      lastRecognitionEventRef.current = Date.now();
      lastActivityTimestampRef.current = Date.now();
      silenceCountRef.current = 0;
    };
    
    recognitionInstance.onspeechend = () => {
      debugLog("Speech ended");
      lastRecognitionEventRef.current = Date.now();
    };
    
  }, [processSpeechResults, startKeepAliveTimer, startContinuousRecognitionTimer, startNoActivityTimer, stabilizeRecognitionStatus, restartRecognition]);

  // Initialize recognition
  useEffect(() => {
    if (!recognition) {
      debugLog("No recognition object provided");
      return;
    }
    
    recognitionRef.current = recognition;
    debugLog("Setting up recognition handlers");
    setupRecognitionHandlers(recognition);
    
    return () => {
      debugLog("Cleaning up recognition handlers");
      try {
        // Try to stop recognition if it's active
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            debugLog("Stopped recognition during cleanup");
          } catch (err) {
            debugLog(`Error stopping recognition: ${err}`);
          }
        }
        
        // Clear all timers
        if (recognitionStabilityTimerRef.current) {
          clearTimeout(recognitionStabilityTimerRef.current);
          recognitionStabilityTimerRef.current = null;
        }
        
        if (recognitionRetryTimerRef.current) {
          clearTimeout(recognitionRetryTimerRef.current);
          recognitionRetryTimerRef.current = null;
        }
        
        if (recognitionKeepAliveTimerRef.current) {
          clearInterval(recognitionKeepAliveTimerRef.current);
          recognitionKeepAliveTimerRef.current = null;
        }
        
        if (continuousRecognitionTimerRef.current) {
          clearTimeout(continuousRecognitionTimerRef.current);
          continuousRecognitionTimerRef.current = null;
        }
        
        if (noActivityTimeoutRef.current) {
          clearTimeout(noActivityTimeoutRef.current);
          noActivityTimeoutRef.current = null;
        }
        
        // Release any audio streams
        releaseAudioStream();
      } catch (err) {
        debugLog(`Error during cleanup: ${err}`);
      }
    };
  }, [recognition, setupRecognitionHandlers]);
  
  // Reset error when isListening changes
  useEffect(() => {
    if (isListening) {
      setError(undefined);
    }
  }, [isListening]);
  
  // Reset unexpected stops counter when we manually stop/start
  useEffect(() => {
    if (!isListening) {
      unexpectedStopsCountRef.current = 0;
      recoveryModeRef.current = false;
      silenceCountRef.current = 0;
    }
  }, [isListening]);
  
  // Start listening function
  const startListening = useCallback(async () => {
    if (isInitializing.current) {
      debugLog("Already initializing, ignoring duplicate start request");
      return;
    }
    
    if (isListening) {
      debugLog("Already listening, ignoring duplicate start request");
      return;
    }
    
    debugLog("Starting speech recognition");
    isInitializing.current = true;
    setIsProcessing(true);
    
    try {
      // Ensure we have audio access before starting recognition
      const audioAvailable = await ensureActiveAudioStream();
      if (!audioAvailable) {
        debugLog("Cannot start recognition: audio stream not available");
        throw new Error("Could not access microphone");
      }
      
      if (!recognition && !recognitionRef.current) {
        throw new Error("Speech recognition not available");
      }
      
      const recognitionObj = recognition || recognitionRef.current;
      
      // Make sure we're not manually stopped
      manuallyStoppedRef.current = false;
      
      // Reset unexpected stops counter
      unexpectedStopsCountRef.current = 0;
      silenceCountRef.current = 0;
      
      // Reset last event timestamp
      lastRecognitionEventRef.current = Date.now();
      lastActivityTimestampRef.current = Date.now();
      
      try {
        // Start recognition
        recognitionObj.start();
        debugLog("Recognition started successfully");
        
        // Wait briefly to ensure start completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update state
        setIsListening(true);
      } catch (err) {
        debugLog(`Error starting recognition: ${err}`);
        
        // The most common error is that recognition is already started,
        // which isn't actually an error for us
        if (err instanceof Error && err.message.includes('already started')) {
          debugLog("Recognition was already started");
          setIsListening(true);
        } else {
          // Try restarting with a delay
          debugLog("Scheduling restart after start failure");
          recognitionRetryTimerRef.current = setTimeout(() => {
            try {
              recognitionObj.start();
              debugLog("Recognition started after retry");
              setIsListening(true);
            } catch (retryErr) {
              debugLog(`Error on retry: ${retryErr}`);
              setError(`Could not start speech recognition: ${retryErr}`);
              setIsListening(false);
            } finally {
              isInitializing.current = false;
              setIsProcessing(false);
            }
          }, 500);
          return;
        }
      }
    } catch (err) {
      debugLog(`Failed to start recognition: ${err}`);
      setError(`Could not start speech recognition: ${err}`);
      setIsListening(false);
    } finally {
      isInitializing.current = false;
      setIsProcessing(false);
    }
  }, [recognition, isListening, setError]);
  
  // Stop listening function
  const stopListening = useCallback(() => {
    if (!isListening) {
      debugLog("Not listening, ignoring stop request");
      return;
    }
    
    debugLog("Stopping speech recognition");
    
    // Mark as manually stopped
    manuallyStoppedRef.current = true;
    
    // Clear all timers
    if (recognitionStabilityTimerRef.current) {
      clearTimeout(recognitionStabilityTimerRef.current);
      recognitionStabilityTimerRef.current = null;
    }
    
    if (recognitionRetryTimerRef.current) {
      clearTimeout(recognitionRetryTimerRef.current);
      recognitionRetryTimerRef.current = null;
    }
    
    if (recognitionKeepAliveTimerRef.current) {
      clearInterval(recognitionKeepAliveTimerRef.current);
      recognitionKeepAliveTimerRef.current = null;
    }
    
    if (continuousRecognitionTimerRef.current) {
      clearTimeout(continuousRecognitionTimerRef.current);
      continuousRecognitionTimerRef.current = null;
    }
    
    if (noActivityTimeoutRef.current) {
      clearTimeout(noActivityTimeoutRef.current);
      noActivityTimeoutRef.current = null;
    }
    
    try {
      // Try to stop recognition
      if (recognition) {
        recognition.stop();
        debugLog("Recognition stopped successfully");
      } else if (recognitionRef.current) {
        recognitionRef.current.stop();
        debugLog("Recognition stopped using ref");
      }
    } catch (err) {
      debugLog(`Error stopping recognition: ${err}`);
    }
    
    // Update state
    setIsListening(false);
  }, [isListening, recognition]);
  
  // Reset transcript function
  const resetTranscript = useCallback(() => {
    debugLog("Resetting transcript");
    resetTranscriptState();
  }, [resetTranscriptState]);
  
  return {
    transcript,
    interimTranscript,
    browserSupportsSpeechRecognition,
    isListening,
    isProcessing,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isPWA,
    isMobile: detectedIsMobile
  };
};

export default useSpeechRecognition;
