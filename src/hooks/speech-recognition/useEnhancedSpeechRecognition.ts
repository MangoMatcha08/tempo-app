
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { detectEnvironment } from './environmentDetection';
import { useTrackedTimeouts } from '../use-tracked-timeouts';
import { RecognitionEnvironment } from './types';
import { handleRecognitionError } from './errorHandlers';

// Type for the enhanced speech recognition hook return value
export interface UseEnhancedSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isRecovering: boolean;
  browserSupportsSpeechRecognition: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  getCompleteTranscript: () => string;
  error?: string;
  isPwa: boolean;
  environmentInfo: {
    isIOS: boolean;
    isIOSPwa: boolean;
    isMobile: boolean;
    platform: string;
    browser: string;
  };
}

/**
 * Enhanced speech recognition hook that provides platform-specific optimizations
 * Builds on the existing speech recognition system with improved reliability
 * 
 * @returns Enhanced speech recognition interface
 */
export const useEnhancedSpeechRecognition = (): UseEnhancedSpeechRecognitionReturn => {
  // Get environment information
  const env = useMemo(() => detectEnvironment(), []);
  
  // State for transcript management
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);
  
  // Refs for managing recognition state
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTranscriptRef = useRef('');
  const retryAttemptsRef = useRef(0);
  
  // Resource management
  const { 
    createTimeout, 
    clearAllTimeouts, 
    runIfMounted,
    isMounted 
  } = useTrackedTimeouts();
  
  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionImpl = window.SpeechRecognition || 
                                  window.webkitSpeechRecognition || 
                                  window.mozSpeechRecognition || 
                                  window.msSpeechRecognition;
    
    if (!SpeechRecognitionImpl) {
      console.error('Speech recognition not supported in this browser');
      setBrowserSupportsSpeechRecognition(false);
      return;
    }
    
    try {
      // Create recognition instance
      recognitionRef.current = new SpeechRecognitionImpl();
      setBrowserSupportsSpeechRecognition(true);
      
      // Configure with environment-specific settings
      if (recognitionRef.current) {
        const recognition = recognitionRef.current;
        
        // Set configuration based on environment
        recognition.continuous = env.recognitionConfig.continuous;
        recognition.interimResults = env.recognitionConfig.interimResults;
        recognition.maxAlternatives = env.recognitionConfig.maxAlternatives;
        
        // Set language based on browser preference
        try {
          recognition.lang = navigator.language || 'en-US';
        } catch (err) {
          recognition.lang = 'en-US';
        }
        
        // Set up base event handlers (detailed handlers added when recording starts)
        recognition.onerror = (event) => {
          // Use our enhanced error handler
          handleRecognitionError(event, {
            isListening,
            env,
            recognitionRef,
            retryAttemptsRef,
            createTimeout,
            onError: (errorMessage) => {
              if (isMounted()) {
                setError(errorMessage);
                setIsListening(false);
              }
            },
            onRecoveryStart: () => {
              if (isMounted()) {
                setIsRecovering(true);
              }
            },
            onRecoveryComplete: () => {
              if (isMounted()) {
                setIsRecovering(false);
              }
            }
          });
        };
      }
    } catch (err) {
      console.error('Error initializing speech recognition:', err);
      setBrowserSupportsSpeechRecognition(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          console.error('Error stopping recognition during cleanup:', err);
        }
      }
    };
  }, []);
  
  /**
   * Start the speech recognition process with platform-specific optimizations
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !browserSupportsSpeechRecognition) {
      console.error('Speech recognition not available');
      return;
    }
    
    // Reset state
    setTranscript('');
    setInterimTranscript('');
    setError(undefined);
    retryAttemptsRef.current = 0;
    accumulatedTranscriptRef.current = '';
    
    try {
      const recognition = recognitionRef.current;
      
      // Set up event handlers
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let currentInterim = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptResult = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcriptResult + ' ';
          } else {
            currentInterim += transcriptResult;
          }
        }
        
        if (finalTranscript) {
          runIfMounted(() => {
            setTranscript(prev => (prev + finalTranscript).trim());
          });
        }
        
        if (currentInterim) {
          runIfMounted(() => {
            setInterimTranscript(currentInterim);
          });
        }
      };
      
      recognition.onend = () => {
        console.log('Recognition ended, isListening:', isListening);
        
        // Only restart if still supposed to be listening
        if (isListening && isMounted()) {
          console.log('Restarting speech recognition...');
          
          // iOS PWA needs special handling
          if (env.isIOSPwa) {
            // Store transcript before restarting
            accumulatedTranscriptRef.current += ' ' + transcript;
            
            createTimeout(() => {
              try {
                recognition.start();
              } catch (err) {
                console.error('Error restarting iOS recognition:', err);
                
                // One more attempt after short delay
                createTimeout(() => {
                  try {
                    recognition.start();
                  } catch (innerErr) {
                    console.error('Second iOS restart attempt failed:', innerErr);
                    setIsListening(false);
                    setError('Recognition failed to restart. Please try again.');
                  }
                }, 500);
              }
            }, env.recognitionConfig.restartDelay);
          } else {
            // Standard restart for other platforms
            createTimeout(() => {
              try {
                recognition.start();
              } catch (err) {
                console.error('Error restarting recognition:', err);
                setIsListening(false);
                setError('Failed to restart recognition. Please try again.');
              }
            }, env.recognitionConfig.restartDelay);
          }
        }
      };
      
      // Start recognition
      recognition.start();
      setIsListening(true);
      
      // For iOS PWA, set up periodic session refresh
      if (env.isIOSPwa) {
        setupIOSPwaSessionRefresh();
      }
      
      console.log('Speech recognition started successfully');
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [
    browserSupportsSpeechRecognition, 
    transcript, 
    createTimeout, 
    runIfMounted, 
    isMounted,
    env
  ]);
  
  /**
   * Set up periodic session refresh for iOS PWA
   * This addresses the issue of iOS PWA terminating long-running recognition sessions
   */
  const setupIOSPwaSessionRefresh = useCallback(() => {
    if (!env.isIOSPwa || !recognitionRef.current) return;
    
    // For iOS PWA, we need to periodically stop and restart recognition
    // to prevent Safari from killing the session
    const refreshInterval = env.recognitionConfig.maxSessionDuration;
    
    createTimeout(() => {
      if (isListening && isMounted()) {
        console.log('iOS PWA: Refreshing recognition session');
        
        try {
          // Store current transcript
          accumulatedTranscriptRef.current += ' ' + transcript;
          
          // Stop current session
          recognitionRef.current?.stop();
          
          // We'll restart automatically via the onend handler
          console.log('iOS PWA session refresh triggered');
        } catch (err) {
          console.error('Error during iOS PWA session refresh:', err);
        }
      }
    }, refreshInterval);
  }, [env.isIOSPwa, env.recognitionConfig.maxSessionDuration, isListening, transcript, createTimeout, isMounted]);
  
  /**
   * Stop the speech recognition process
   */
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      // For iOS PWA, save accumulated transcript
      if (env.isIOSPwa) {
        accumulatedTranscriptRef.current += ' ' + transcript;
      }
      
      // Stop recognition
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Clear any interim transcript
      setInterimTranscript('');
      
      console.log('Speech recognition stopped');
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      
      // Force recognition to stop
      try {
        recognitionRef.current.abort();
        setIsListening(false);
      } catch (abortErr) {
        console.error('Error aborting speech recognition:', abortErr);
      }
    }
  }, [env.isIOSPwa, transcript]);
  
  /**
   * Reset the transcript
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);
  
  /**
   * Get the complete transcript, including accumulated parts for iOS PWA
   */
  const getCompleteTranscript = useCallback(() => {
    if (env.isIOSPwa) {
      const complete = (accumulatedTranscriptRef.current + ' ' + transcript).trim();
      // Reset accumulated transcript
      accumulatedTranscriptRef.current = '';
      return complete;
    }
    return transcript;
  }, [env.isIOSPwa, transcript]);
  
  // Create environment info object for return value
  const environmentInfo = useMemo(() => {
    return {
      isIOS: env.isIOS,
      isIOSPwa: env.isIOSPwa,
      isMobile: env.isMobile,
      platform: env.isIOS ? 'iOS' : (env.isAndroid ? 'Android' : 'Desktop'),
      browser: env.isSafari ? 'Safari' : 
               (env.isChrome ? 'Chrome' : 
               (env.isFirefox ? 'Firefox' : 
               (env.isEdge ? 'Edge' : 'Other')))
    };
  }, [env]);
  
  return {
    transcript,
    interimTranscript,
    isListening,
    isRecovering,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    resetTranscript,
    getCompleteTranscript,
    error,
    isPwa: env.isPwa,
    environmentInfo
  };
};

export default useEnhancedSpeechRecognition;
