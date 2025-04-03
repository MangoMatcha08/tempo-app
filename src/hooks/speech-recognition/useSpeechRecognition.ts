import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { useTranscriptState } from './useTranscriptState';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';
import { 
  ensureActiveAudioStream, 
  releaseAudioStream, 
  isIOSDevice, 
  isPwaMode,
  createNoResultsTimeout,
  diagnoseAudioContext
} from './utils';
import { UseSpeechRecognitionReturn } from './types';

const debugLog = createDebugLogger("SpeechRecognition");

// Enhanced Speech Recognition Hook with improved stability
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef<number>(0);
  const isProcessingResultRef = useRef<boolean>(false);
  const lastRecognitionEventRef = useRef<number>(0);
  const recognitionStabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const manuallyStoppedRef = useRef<boolean>(false);
  const noResultsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearNoResultsTimeoutRef = useRef<(() => void) | null>(null);
  const hasReceivedAnyResultsRef = useRef<boolean>(false);
  const diagnosticTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionStartTimeRef = useRef<number>(0);
  const audioContextDiagnosedRef = useRef<boolean>(false);
  
  // Detect iOS and PWA status
  const isIOS = isIOSDevice();
  const isPWA = isPwaMode();
  
  // Callback to handle errors
  const handleError = useCallback((newError: string | undefined) => {
    setError(newError);
  }, []);
  
  // Set up recognition with enhanced configuration
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
  
  // Helper to stabilize recognition status with improved diagnostics
  const stabilizeRecognitionStatus = useCallback(() => {
    if (recognitionStabilityTimerRef.current) {
      clearTimeout(recognitionStabilityTimerRef.current);
    }
    
    // If we haven't received events in a while but still think we're listening,
    // force a stability check
    recognitionStabilityTimerRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastEvent = now - lastRecognitionEventRef.current;
      const timeSinceStart = now - recognitionStartTimeRef.current;
      
      // Log detailed diagnostic information
      debugLog(`Recognition stability: ${timeSinceLastEvent}ms since last event, ${timeSinceStart}ms since start`);
      debugLog(`Recognition state: isListening=${isListening}, hasResults=${hasReceivedAnyResultsRef.current}, manuallyStopped=${manuallyStoppedRef.current}`);
      
      // If no events for 5+ seconds but still in listening state, attempt recovery
      if (isListening && timeSinceLastEvent > 5000 && !manuallyStoppedRef.current) {
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
            if (isListening && !manuallyStoppedRef.current) {
              await ensureActiveAudioStream();
              try {
                recognition?.start();
                debugLog("Restarted recognition after aggressive recovery");
                startDiagnosticTimeout();
              } catch (e) {
                debugLog(`Recovery restart failed: ${e}`);
                if (isListening) setIsListening(false);
              }
            }
          }, 800);
        } else if (timeSinceStart > 10000 && !hasReceivedAnyResultsRef.current) {
          // If we've been running for more than 10 seconds with no results at all,
          // there's likely a deeper problem - try a more radical approach
          debugLog("No results received for 10+ seconds, attempting radical recovery");
          
          try {
            // Stop current recognition
            try {
              recognition?.stop();
              debugLog("Stopped recognition for radical recovery");
            } catch (e) {
              // Ignore errors on stop
            }
            
            // Force close any existing stream
            releaseAudioStream();
            
            // Run audio diagnostics
            if (!audioContextDiagnosedRef.current) {
              audioContextDiagnosedRef.current = true;
              diagnoseAudioContext().then(success => {
                debugLog(`Audio context diagnostic result: ${success ? 'OK' : 'Failed'}`);
              });
            }
            
            // Add delay to ensure cleanup
            setTimeout(async () => {
              if (isListening && !manuallyStoppedRef.current) {
                // Request a fresh stream
                const streamOK = await ensureActiveAudioStream();
                
                if (streamOK) {
                  // Try with altered recognition settings
                  if (recognition) {
                    // Flip continuous mode as a test
                    recognition.continuous = !recognition.continuous;
                    debugLog(`Altered recognition settings: continuous=${recognition.continuous}`);
                    
                    setTimeout(() => {
                      try {
                        recognition.start();
                        debugLog("Restarted recognition with altered settings");
                        startDiagnosticTimeout();
                      } catch (e) {
                        debugLog(`Altered settings restart failed: ${e}`);
                        if (isListening) setIsListening(false);
                      }
                    }, 500);
                  }
                } else {
                  debugLog("Failed to get fresh audio stream during radical recovery");
                  setIsListening(false);
                }
              }
            }, 1000);
          } catch (e) {
            debugLog(`Radical recovery failed: ${e}`);
            setIsListening(false);
          }
        }
      }
      
      recognitionStabilityTimerRef.current = null;
      
      // Continue monitoring if still in listening state
      if (isListening && !manuallyStoppedRef.current) {
        stabilizeRecognitionStatus();
      }
    }, 6000);
    
  }, [isListening, isIOS, isMobile, recognition]);
  
  // Add enhanced diagnostic timeout with recovery actions
  const startDiagnosticTimeout = useCallback(() => {
    // Clear any existing timeout
    if (diagnosticTimeoutRef.current) {
      clearTimeout(diagnosticTimeoutRef.current);
    }
    
    // Set a diagnostic timeout to monitor for results
    diagnosticTimeoutRef.current = setTimeout(() => {
      // Only act if we're listening but haven't received any results
      if (isListening && !manuallyStoppedRef.current && !hasReceivedAnyResultsRef.current) {
        debugLog("Diagnostic timeout triggered - no results received");
        
        // Attempt recovery by modifying recognition settings and restarting
        try {
          if (recognition) {
            // Stop current recognition
            try {
              recognition.stop();
              debugLog("Stopped recognition for diagnostic recovery");
            } catch (e) {
              // Ignore errors on stop
            }
            
            // Try with different settings
            recognition.continuous = !recognition.continuous;
            recognition.interimResults = true;
            
            debugLog(`Altered recognition settings: continuous=${recognition.continuous}`);
            
            // Short delay before restart
            setTimeout(async () => {
              if (isListening && !manuallyStoppedRef.current) {
                try {
                  // Ensure we have a valid audio stream
                  await ensureActiveAudioStream();
                  
                  recognition.start();
                  debugLog("Restarted recognition with altered settings after diagnostic timeout");
                } catch (e) {
                  debugLog(`Diagnostic recovery restart failed: ${e}`);
                }
              }
            }, 800);
          }
        } catch (e) {
          debugLog(`Diagnostic recovery failed: ${e}`);
        }
      }
      
      diagnosticTimeoutRef.current = null;
    }, 8000); // 8 second timeout for receiving any results
    
    return () => {
      if (diagnosticTimeoutRef.current) {
        clearTimeout(diagnosticTimeoutRef.current);
        diagnosticTimeoutRef.current = null;
      }
    };
  }, [isListening, recognition]);
  
  // Add timeout for no results
  const startNoResultsTimeout = useCallback(() => {
    // Clear any existing timeout
    if (clearNoResultsTimeoutRef.current) {
      clearNoResultsTimeoutRef.current();
      clearNoResultsTimeoutRef.current = null;
    }
    
    // Set a function to handle timeout
    const handleNoResultsTimeout = () => {
      if (isListening && !manuallyStoppedRef.current && transcript === '') {
        debugLog("No results received after timeout - restarting recognition");
        
        // Try to restart recognition
        try {
          if (recognition) {
            try {
              recognition.stop();
            } catch (e) {
              // Ignore stop errors
            }
            
            setTimeout(async () => {
              if (isListening && !manuallyStoppedRef.current) {
                await ensureActiveAudioStream();
                try {
                  recognition.start();
                  debugLog("Restarted recognition after no results timeout");
                  // Restart the timeout
                  startNoResultsTimeout();
                } catch (e) {
                  debugLog(`No results restart failed: ${e}`);
                }
              }
            }, 800);
          }
        } catch (e) {
          debugLog(`Error in no results timeout: ${e}`);
        }
      }
    };
    
    // Create a timeout that we can clear
    clearNoResultsTimeoutRef.current = createNoResultsTimeout(8000, handleNoResultsTimeout);
    
  }, [isListening, transcript, recognition]);
  
  // Enhanced result handler with diagnostic logging
  useEffect(() => {
    if (!recognition) return;
    
    // Set up all event handlers in one place for better cleanup
    const handleResults = (event: any) => {
      debugLog("Recognition results received");
      lastRecognitionEventRef.current = Date.now();
      hasReceivedAnyResultsRef.current = true;
      
      // Clear diagnostic timeout since we got results
      if (diagnosticTimeoutRef.current) {
        clearTimeout(diagnosticTimeoutRef.current);
        diagnosticTimeoutRef.current = null;
      }
      
      // Detailed diagnostic logging of results
      try {
        const results = event.results;
        debugLog(`Received ${results?.length || 0} result groups`);
        
        if (results && results.length > 0) {
          // Log the first result for debugging
          const firstResult = results[0];
          if (firstResult && firstResult[0]) {
            const transcript = firstResult[0].transcript || '';
            const confidence = firstResult[0].confidence || 0;
            debugLog(`First result: "${transcript.substring(0, 30)}${transcript.length > 30 ? '...' : ''}" (confidence: ${confidence.toFixed(2)})`);
          }
        }
      } catch (err) {
        debugLog(`Error logging results: ${err}`);
      }
      
      // Prevent duplicate processing on iOS
      if (!isProcessingResultRef.current) {
        isProcessingResultRef.current = true;
        try {
          processSpeechResults(event);
          
          // Reset the flag after a delay to prevent rapid duplicates
          // but allow subsequent legitimate results
          setTimeout(() => {
            isProcessingResultRef.current = false;
          }, 200);
        } catch (err) {
          debugLog(`Error processing results: ${err}`);
          isProcessingResultRef.current = false;
        }
      } else {
        debugLog("Ignoring results - already processing");
      }
      
      // Ensure recognition remains stable
      stabilizeRecognitionStatus();
      
      // Reset the no results timeout since we got results
      if (clearNoResultsTimeoutRef.current) {
        clearNoResultsTimeoutRef.current();
        startNoResultsTimeout();
      }
    };
    
    const handleEnd = () => {
      debugLog('Speech recognition ended, isListening state:', isListening);
      lastRecognitionEventRef.current = Date.now();
      
      // Only restart if still supposed to be listening and not manually stopped
      if (isListening && !manuallyStoppedRef.current) {
        debugLog('Restarting speech recognition...');
        
        try {
          // Platform-specific restart delay - longer for iOS
          const restartDelay = isIOS ? 
            (isPWA ? 1000 : 800) : 
            (isPWA ? 600 : 300);
          
          debugLog(`Using restart delay of ${restartDelay}ms for ${isIOS ? 'iOS' : 'non-iOS'}`);
          
          setTimeout(async () => {
            if (isListening && !manuallyStoppedRef.current) {
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
                      if (isListening && !manuallyStoppedRef.current) {
                        recognition.start();
                        debugLog("iOS PWA: Recognition restarted after stop-start sequence");
                        startDiagnosticTimeout();
                      }
                    } catch (iosErr) {
                      debugLog(`iOS PWA restart failed: ${iosErr}`);
                      setError('Speech recognition failed. Please try again.');
                      setIsListening(false);
                    }
                  }, 300);
                } else {
                  // Standard restart for other platforms
                  if (isListening && !manuallyStoppedRef.current) {
                    recognition.start();
                    debugLog("Recognition restarted after timeout");
                    startDiagnosticTimeout();
                    
                    // Reset the no results timeout
                    startNoResultsTimeout();
                  }
                }
              } catch (startErr) {
                debugLog(`Error on restart: ${startErr}`);
                
                // Special handling for iOS Safari which can be finicky
                if (isIOS) {
                  debugLog("iOS detected, using special restart approach");
                  setTimeout(async () => {
                    try {
                      if (isListening && !manuallyStoppedRef.current) {
                        // For iOS, try reacquiring the audio stream
                        await ensureActiveAudioStream();
                        
                        recognition.start();
                        debugLog("iOS special restart successful");
                        startNoResultsTimeout();
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
              debugLog("Not restarting - no longer listening or manually stopped");
            }
          }, restartDelay);
        } catch (err) {
          debugLog(`Error restarting recognition: ${err}`);
          setError('Failed to restart speech recognition. Please try again.');
          setIsListening(false);
        }
      } else {
        debugLog(`Not restarting - listening state is ${isListening}, manually stopped: ${manuallyStoppedRef.current}`);
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
    
    const handleSpeechStart = () => {
      debugLog("Speech detected - user has begun speaking");
      lastRecognitionEventRef.current = Date.now();
    };
    
    const handleSpeechEnd = () => {
      debugLog("Speech ended - user has stopped speaking");
      lastRecognitionEventRef.current = Date.now();
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
      if (['network', 'service-not-allowed', 'aborted'].includes(event.error) && isListening && !manuallyStoppedRef.current) {
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
            if (isListening && !manuallyStoppedRef.current) {
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
                    if (isListening && !manuallyStoppedRef.current) {
                      recognition.start();
                      debugLog("Recovery successful");
                      startNoResultsTimeout();
                      startDiagnosticTimeout();
                    }
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
    
    const handleNoMatch = (event: any) => {
      debugLog("No match event received");
      lastRecognitionEventRef.current = Date.now();
      
      // On no match, try to restart the recognition
      if (isListening && !manuallyStoppedRef.current) {
        debugLog("No match, attempting to restart recognition");
        
        setTimeout(async () => {
          if (isListening && !manuallyStoppedRef.current) {
            try {
              recognition.stop();
            } catch (e) {
              // Ignore stop errors
            }
            
            setTimeout(async () => {
              if (isListening && !manuallyStoppedRef.current) {
                try {
                  recognition.start();
                  debugLog("Restarted after no match");
                  startNoResultsTimeout();
                  startDiagnosticTimeout();
                } catch (e) {
                  debugLog(`Restart after no match failed: ${e}`);
                }
              }
            }, 500);
          }
        }, 300);
      }
    };
    
    // Set up event handlers
    recognition.onresult = handleResults;
    recognition.onend = handleEnd;
    recognition.onerror = handleError;
    recognition.onaudiostart = handleAudioStart;
    recognition.onnomatch = handleNoMatch;
    recognition.onspeechstart = handleSpeechStart;
    recognition.onspeechend = handleSpeechEnd;
    
    return () => {
      // Clean up event handlers
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onaudiostart = null;
        recognition.onnomatch = null;
        recognition.onspeechstart = null;
        recognition.onspeechend = null;
        
        if (recognitionStabilityTimerRef.current) {
          clearTimeout(recognitionStabilityTimerRef.current);
          recognitionStabilityTimerRef.current = null;
        }
        
        if (clearNoResultsTimeoutRef.current) {
          clearNoResultsTimeoutRef.current();
          clearNoResultsTimeoutRef.current = null;
        }
        
        if (diagnosticTimeoutRef.current) {
          clearTimeout(diagnosticTimeoutRef.current);
          diagnosticTimeoutRef.current = null;
        }
      }
    };
  }, [recognition, isListening, processSpeechResults, isIOS, isPWA, setError, stabilizeRecognitionStatus, startNoResultsTimeout, startDiagnosticTimeout]);
  
  // Enhanced start listening function with improved audio initialization
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
    
    if (clearNoResultsTimeoutRef.current) {
      clearNoResultsTimeoutRef.current();
      clearNoResultsTimeoutRef.current = null;
    }
    
    if (diagnosticTimeoutRef.current) {
      clearTimeout(diagnosticTimeoutRef.current);
      diagnosticTimeoutRef.current = null;
    }
    
    // Reset the transcript and flags
    resetTranscriptState();
    setError(undefined);
    attemptCountRef.current = 0;
    isProcessingResultRef.current = false;
    lastRecognitionEventRef.current = Date.now();
    manuallyStoppedRef.current = false;
    hasReceivedAnyResultsRef.current = false;
    recognitionStartTimeRef.current = Date.now();
    
    // Diagnose audio context if not already done
    if (!audioContextDiagnosedRef.current) {
      audioContextDiagnosedRef.current = true;
      diagnoseAudioContext().then(success => {
        debugLog(`Initial audio context diagnostic: ${success ? 'OK' : 'Failed'}`);
      });
    }
    
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
            if (!manuallyStoppedRef.current) {
              recognition.start();
              debugLog("Recognition started with iOS-optimized delay");
              startNoResultsTimeout();
              startDiagnosticTimeout();
            } else {
              debugLog("Not starting - manually stopped during delay");
            }
            startTimeoutRef.current = null;
            
            // Start stability monitor
            if (!manuallyStoppedRef.current) {
              stabilizeRecognitionStatus();
            }
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
      // Standard start for other platforms with audio pre-check
      try {
        // Ensure audio stream is available for all platforms
        const hasPermission = await ensureActiveAudioStream();
        
        if (!hasPermission) {
          setError("Microphone permission is required");
          return;
        }
        
        setIsListening(true);
        
        // Small delay for stability even on non-iOS
        const startDelay = isPWA ? 200 : 50;
        
        startTimeoutRef.current = setTimeout(() => {
          try {
            if (!manuallyStoppedRef.current) {
              recognition.start();
              debugLog("Recognition started successfully");
              startNoResultsTimeout();
              startDiagnosticTimeout();
            } else {
              debugLog("Not starting - manually stopped during delay");
            }
            startTimeoutRef.current = null;
            
            // Start stability monitor
            if (!manuallyStoppedRef.current) {
              stabilizeRecognitionStatus();
            }
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
  }, [
    recognition, 
    resetTranscriptState, 
    isIOS, 
    isPWA, 
    stabilizeRecognitionStatus, 
    startNoResultsTimeout,
    startDiagnosticTimeout
  ]);
  
  // Enhanced stop listening function with improved cleanup
  const stopListening = useCallback(() => {
    debugLog(`Stopping speech recognition. Is iOS: ${isIOS}, Is PWA: ${isPWA}`);
    
    // Mark as manually stopped to prevent automatic restarts
    manuallyStoppedRef.current = true;
    
    // Clear any pending start timeouts
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    
    if (recognitionStabilityTimerRef.current) {
      clearTimeout(recognitionStabilityTimerRef.current);
      recognitionStabilityTimerRef.current = null;
    }
    
    if (clearNoResultsTimeoutRef.current) {
      clearNoResultsTimeoutRef.current();
      clearNoResultsTimeoutRef.current = null;
    }
    
    if (diagnosticTimeoutRef.current) {
      clearTimeout(diagnosticTimeoutRef.current);
      diagnosticTimeoutRef.current = null;
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
    
    // Log transcript status on stop
    debugLog(`Transcript status on stop: "${transcript.substring(0, 30)}${transcript.length > 30 ? '...' : ''}", interim: "${interimTranscript.substring(0, 30)}${interimTranscript.length > 30 ? '...' : ''}"`);
    
    // Reset processing flag
    isProcessingResultRef.current = false;
    
    // For iOS, release the audio stream when stopping
    // This helps with permission context in some cases
    if (isIOS && !isPWA) {
      debugLog("iOS: Releasing audio stream on stop");
      releaseAudioStream();
    }
    
    // For iOS PWA, keep the stream alive for faster restarts
  }, [recognition, isIOS, isPWA, transcript, interimTranscript]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionStabilityTimerRef.current) {
        clearTimeout(recognitionStabilityTimerRef.current);
      }
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
      if (clearNoResultsTimeoutRef.current) {
        clearNoResultsTimeoutRef.current();
      }
      if (diagnosticTimeoutRef.current) {
        clearTimeout(diagnosticTimeoutRef.current);
      }
      
      // Ensure recognition is stopped
      if (recognition && isListening) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      // Release audio resources
      releaseAudioStream();
    };
  }, [recognition, isListening]);
  
  // Log state changes for debugging
  useEffect(() => {
    debugLog(`isListening changed to: ${isListening}`);
  }, [isListening]);
  
  useEffect(() => {
    debugLog(`transcript changed: ${transcript ? 'has content' : 'empty'}`);
  }, [transcript]);
  
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
