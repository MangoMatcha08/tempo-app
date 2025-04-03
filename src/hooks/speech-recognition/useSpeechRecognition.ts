
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { useTranscriptState } from './useTranscriptState';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';
import { ensureActiveAudioStream, releaseAudioStream, isIOSDevice, isPwaMode } from './utils';
import { UseSpeechRecognitionReturn } from './types';

const debugLog = createDebugLogger("SpeechRecognition");

// Enhanced Speech Recognition Hook with iOS PWA support
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef<number>(0);
  const isProcessingResultRef = useRef<boolean>(false);
  const lastRecognitionEventRef = useRef<number>(0);
  const recognitionStabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect iOS and PWA status
  const isIOS = isIOSDevice();
  const isPWA = isPwaMode();
  
  // Callback to handle errors
  const handleError = useCallback((newError: string | undefined) => {
    setError(newError);
  }, []);
  
  // Set up recognition with iOS-aware configuration
  const { 
    recognition,
    browserSupportsSpeechRecognition,
    isPWA: detectedIsPWA,
    isIOS: detectedIsIOS
  } = useSpeechRecognitionSetup({
    onError: handleError,
    isListening,
    setIsListening
  });
  
  // Improved transcript state management with iOS optimizations
  const { 
    transcript, 
    interimTranscript,
    isProcessing,
    resetTranscriptState,
    processSpeechResults
  } = useTranscriptState({ isPWA: detectedIsPWA, isIOS: detectedIsIOS });
  
  // Helper to stabilize recognition status
  const stabilizeRecognitionStatus = useCallback(() => {
    if (recognitionStabilityTimerRef.current) {
      clearTimeout(recognitionStabilityTimerRef.current);
    }
    
    // If we haven't received events in a while but still think we're listening,
    // force a stability check
    recognitionStabilityTimerRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastEvent = now - lastRecognitionEventRef.current;
      
      // If no events for 5+ seconds but still in listening state, attempt recovery
      if (isListening && timeSinceLastEvent > 5000) {
        debugLog(`Recognition may be stuck: ${timeSinceLastEvent}ms since last event`);
        
        // For iOS mobile, try a more aggressive recovery
        if (isIOS && isMobile) {
          debugLog("iOS mobile detected, performing aggressive recovery");
          
          // Stop current recognition
          try {
            recognition?.stop();
            debugLog("Stopped potentially stuck recognition");
          } catch (e) {
            // Ignore errors on stop
          }
          
          // Short delay before restart
          setTimeout(async () => {
            if (isListening) {
              await ensureActiveAudioStream();
              try {
                recognition?.start();
                debugLog("Restarted recognition after aggressive recovery");
              } catch (e) {
                debugLog(`Recovery restart failed: ${e}`);
                setIsListening(false);
              }
            }
          }, 800);
        }
      }
      
      recognitionStabilityTimerRef.current = null;
    }, 6000);
  }, [isListening, isIOS, isMobile, recognition]);
  
  // Enhanced result handler with iOS-specific optimizations
  useEffect(() => {
    if (!recognition) return;
    
    // Set up all event handlers in one place for better cleanup
    const handleResults = (event: any) => {
      debugLog("Recognition results received");
      lastRecognitionEventRef.current = Date.now();
      
      // Prevent duplicate processing on iOS
      if (!isProcessingResultRef.current && isListening) {
        isProcessingResultRef.current = true;
        try {
          processSpeechResults(event);
          
          // Reset the flag after a delay to prevent rapid duplicates
          // but allow subsequent legitimate results
          setTimeout(() => {
            isProcessingResultRef.current = false;
          }, 1000);
        } catch (err) {
          debugLog(`Error processing results: ${err}`);
          isProcessingResultRef.current = false;
        }
      } else {
        debugLog("Ignoring results - already processing or not listening");
      }
      
      // Ensure recognition remains stable
      stabilizeRecognitionStatus();
    };
    
    const handleEnd = () => {
      debugLog('Speech recognition ended, isListening state:', isListening);
      lastRecognitionEventRef.current = Date.now();
      
      // Only restart if still supposed to be listening
      if (isListening) {
        debugLog('Restarting speech recognition...');
        
        try {
          // Platform-specific restart delay - longer for iOS
          const restartDelay = isIOS ? 
            (isPWA ? 1000 : 800) : 
            (isPWA ? 600 : 300);
          
          debugLog(`Using restart delay of ${restartDelay}ms for ${isIOS ? 'iOS' : 'non-iOS'}`);
          
          setTimeout(async () => {
            if (isListening) {
              try {
                if (isIOS && isPWA) {
                  // For iOS PWA, ensure we have an active audio stream before restarting
                  debugLog("iOS PWA: Reestablishing audio stream before restart");
                  await ensureActiveAudioStream();
                  
                  // Force stop first (iOS needs this)
                  try {
                    recognition.stop();
                  } catch (e) {
                    // Ignore - may not be started
                  }
                  
                  // Add another delay for iOS before starting
                  setTimeout(() => {
                    try {
                      recognition.start();
                      debugLog("iOS PWA: Recognition restarted after stop-start sequence");
                    } catch (iosErr) {
                      debugLog(`iOS PWA restart failed: ${iosErr}`);
                      setError('Speech recognition failed. Please try again.');
                      setIsListening(false);
                    }
                  }, 300);
                } else {
                  // Standard restart for other platforms
                  recognition.start();
                  debugLog("Recognition restarted after timeout");
                }
              } catch (startErr) {
                debugLog(`Error on restart: ${startErr}`);
                
                // Special handling for iOS Safari which can be finicky
                if (isIOS) {
                  debugLog("iOS detected, using special restart approach");
                  setTimeout(async () => {
                    try {
                      if (isListening) {
                        // For iOS, try reacquiring the audio stream
                        await ensureActiveAudioStream();
                        
                        recognition.start();
                        debugLog("iOS special restart successful");
                      }
                    } catch (iosErr) {
                      debugLog(`iOS restart failed: ${iosErr}`);
                      setError('Speech recognition failed. Please try again.');
                      setIsListening(false);
                    }
                  }, 1000);
                } else {
                  setError('Failed to restart speech recognition. Please try again.');
                  setIsListening(false);
                }
              }
            } else {
              debugLog("Not restarting - no longer listening");
            }
          }, restartDelay);
        } catch (err) {
          debugLog(`Error restarting recognition: ${err}`);
          setError('Failed to restart speech recognition. Please try again.');
          setIsListening(false);
        }
      } else {
        debugLog("Not restarting - listening state is false");
      }
      
      // Ensure recognition remains stable
      stabilizeRecognitionStatus();
    };
    
    const handleAudioStart = () => {
      debugLog("Audio capturing started");
      lastRecognitionEventRef.current = Date.now();
      
      // If we weren't in listening state but audio started, sync the state
      if (!isListening) {
        debugLog("Audio started but state was not listening - syncing state");
        setIsListening(true);
      }
      
      // Ensure recognition remains stable
      stabilizeRecognitionStatus();
    };
    
    const handleError = (event: any) => {
      debugLog(`Recognition error: ${event.error}, isListening: ${isListening}`);
      lastRecognitionEventRef.current = Date.now();
      
      // Don't treat no-speech as critical error on iOS
      if (event.error === 'no-speech' && isIOS) {
        debugLog("iOS: Ignoring no-speech error");
        return;
      }
      
      // Implement iOS recovery logic with exponential backoff
      if (['network', 'service-not-allowed', 'aborted'].includes(event.error) && isListening) {
        debugLog(`Recoverable error: ${event.error} - attempting recovery`);
        
        const baseDelay = 300;
        const maxAttempts = 3;
        
        if (attemptCountRef.current < maxAttempts) {
          // Exponential backoff with jitter
          const backoffFactor = Math.min(Math.pow(1.5, attemptCountRef.current), 10);
          const jitter = Math.random() * 0.3 + 0.85;
          const backoffTime = Math.min(baseDelay * backoffFactor * jitter, 5000);
          
          debugLog(`Recovery attempt ${attemptCountRef.current + 1}/${maxAttempts} with delay ${backoffTime}ms`);
          
          setTimeout(async () => {
            if (isListening) {
              try {
                // For iOS, ensure we have an active audio stream
                if (isIOS) {
                  await ensureActiveAudioStream();
                }
                
                try {
                  recognition.stop();
                } catch (e) {
                  // Ignore - may not be started
                }
                
                setTimeout(() => {
                  try {
                    recognition.start();
                    debugLog("Recovery successful");
                  } catch (startErr) {
                    debugLog(`Recovery start failed: ${startErr}`);
                  }
                }, 300);
              } catch (err) {
                debugLog(`Recovery attempt failed: ${err}`);
              }
            }
          }, backoffTime);
          
          attemptCountRef.current++;
        } else {
          debugLog("Max recovery attempts reached");
          setError('Recognition failed after multiple attempts. Please try again.');
          setIsListening(false);
        }
      }
      
      // Ensure recognition remains stable
      stabilizeRecognitionStatus();
    };
    
    // Set up event handlers
    recognition.onresult = handleResults;
    recognition.onend = handleEnd;
    recognition.onerror = handleError;
    recognition.onaudiostart = handleAudioStart;
    
    return () => {
      // Clean up event handlers
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onaudiostart = null;
        
        if (recognitionStabilityTimerRef.current) {
          clearTimeout(recognitionStabilityTimerRef.current);
          recognitionStabilityTimerRef.current = null;
        }
      }
    };
  }, [recognition, isListening, processSpeechResults, isIOS, isPWA, setError, stabilizeRecognitionStatus]);
  
  // Enhanced start listening function with iOS-specific handling
  const startListening = useCallback(async () => {
    if (!recognition) {
      setError("Speech recognition not available");
      return;
    }
    
    debugLog(`Starting speech recognition. Is iOS: ${isIOS}, Is PWA: ${isPWA}`);
    
    // Clear any previous start timeouts
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    
    // Reset the transcript and flags
    resetTranscriptState();
    setError(undefined);
    attemptCountRef.current = 0;
    isProcessingResultRef.current = false;
    lastRecognitionEventRef.current = Date.now();
    
    // iOS-specific pre-start sequence
    if (isIOS) {
      debugLog("iOS detected, using special start sequence");
      
      try {
        // For iOS, ensure we have an active audio stream first
        const hasPermission = await ensureActiveAudioStream();
        
        if (!hasPermission) {
          setError("Microphone permission is required");
          return;
        }
        
        // Force stop any existing recognition
        try {
          recognition.stop();
          debugLog("Stopped any existing recognition");
        } catch (e) {
          // Ignore - may not be started
        }
        
        // Set listening state to true
        setIsListening(true);
        
        // Add critical delay for iOS before starting
        const startDelay = isPWA ? 800 : 500; // Longer for PWA on iOS
        
        debugLog(`Adding iOS-specific delay of ${startDelay}ms before starting recognition`);
        
        startTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
            debugLog("Recognition started with iOS-optimized delay");
            startTimeoutRef.current = null;
            
            // Start stability monitor
            stabilizeRecognitionStatus();
          } catch (error) {
            debugLog(`Error starting recognition: ${error}`);
            setError("Failed to start speech recognition. Please try again.");
            setIsListening(false);
            startTimeoutRef.current = null;
          }
        }, startDelay);
      } catch (error) {
        debugLog(`iOS start sequence error: ${error}`);
        setError("Failed to initialize speech recognition");
        setIsListening(false);
      }
    } else {
      // Standard start for other platforms
      try {
        setIsListening(true);
        
        // Small delay for stability even on non-iOS
        const startDelay = isPWA ? 200 : 50;
        
        startTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
            debugLog("Recognition started successfully");
            startTimeoutRef.current = null;
            
            // Start stability monitor
            stabilizeRecognitionStatus();
          } catch (error) {
            debugLog(`Error starting recognition: ${error}`);
            setError("Failed to start speech recognition. Please try again.");
            setIsListening(false);
            startTimeoutRef.current = null;
          }
        }, startDelay);
      } catch (error) {
        debugLog(`Start error: ${error}`);
        setError("Failed to start speech recognition");
        setIsListening(false);
      }
    }
  }, [recognition, resetTranscriptState, isIOS, isPWA, stabilizeRecognitionStatus]);
  
  // Enhanced stop listening function with iOS-specific cleanup
  const stopListening = useCallback(() => {
    debugLog(`Stopping speech recognition. Is iOS: ${isIOS}, Is PWA: ${isPWA}`);
    
    // Clear any pending start timeouts
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    
    if (recognitionStabilityTimerRef.current) {
      clearTimeout(recognitionStabilityTimerRef.current);
      recognitionStabilityTimerRef.current = null;
    }
    
    setIsListening(false);
    
    if (recognition) {
      try {
        recognition.stop();
        debugLog("Recognition stopped successfully");
      } catch (error) {
        debugLog(`Error stopping recognition: ${error}`);
        // Non-critical error, don't set error state
      }
    }
    
    // Reset processing flag
    isProcessingResultRef.current = false;
    
    // For iOS, release the audio stream when stopping
    // This helps with permission context in some cases
    if (isIOS && !isPWA) {
      debugLog("iOS: Releasing audio stream on stop");
      releaseAudioStream();
    }
    
    // For iOS PWA, keep the stream alive for faster restarts
  }, [recognition, isIOS, isPWA]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionStabilityTimerRef.current) {
        clearTimeout(recognitionStabilityTimerRef.current);
      }
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
      
      // Ensure recognition is stopped
      if (recognition && isListening) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [recognition, isListening]);
  
  // Export the enhanced API
  return {
    transcript,
    interimTranscript,
    browserSupportsSpeechRecognition,
    isListening,
    startListening,
    stopListening,
    resetTranscript: resetTranscriptState,
    error,
    isPWA: detectedIsPWA,
    isMobile
  };
};

export default useSpeechRecognition;
