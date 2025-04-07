import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { detectEnvironment } from './environmentDetection';
import { useTrackedTimeouts } from '../use-tracked-timeouts';
import { RecognitionEnvironment } from './types';
import { handleRecognitionError } from './errorHandlers';

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
    isPwa: boolean;
    platform: string;
    browser: string;
  };
}

export const useEnhancedSpeechRecognition = (): UseEnhancedSpeechRecognitionReturn => {
  const env = useMemo(() => detectEnvironment(), []);

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTranscriptRef = useRef('');
  const retryAttemptsRef = useRef(0);

  const { 
    createTimeout, 
    clearAllTimeouts, 
    runIfMounted,
    isMounted 
  } = useTrackedTimeouts();

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
      recognitionRef.current = new SpeechRecognitionImpl();
      setBrowserSupportsSpeechRecognition(true);
      
      if (recognitionRef.current) {
        const recognition = recognitionRef.current;
        
        recognition.continuous = env.recognitionConfig.continuous;
        recognition.interimResults = env.recognitionConfig.interimResults;
        recognition.maxAlternatives = env.recognitionConfig.maxAlternatives;
        
        try {
          recognition.lang = navigator.language || 'en-US';
        } catch (err) {
          recognition.lang = 'en-US';
        }
        
        recognition.onerror = (event) => {
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

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      if (env.isIOSPwa) {
        accumulatedTranscriptRef.current += ' ' + transcript;
      }
      
      recognitionRef.current.stop();
      setIsListening(false);
      
      setInterimTranscript('');
      
      console.log('Speech recognition stopped');
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      
      try {
        recognitionRef.current.abort();
        setIsListening(false);
      } catch (abortErr) {
        console.error('Error aborting speech recognition:', abortErr);
      }
    }
  }, [env.isIOSPwa, transcript]);

  const setupIOSPwaSessionRefresh = useCallback(() => {
    if (!env.isIOSPwa || !recognitionRef.current) return;
    
    const refreshInterval = 8000;
    
    createTimeout(() => {
      if (isListening && isMounted()) {
        console.log('iOS PWA: Refreshing recognition session');
        
        try {
          accumulatedTranscriptRef.current += ' ' + transcript;
          
          recognitionRef.current?.stop();
          
          console.log('iOS PWA session refresh triggered');
        } catch (err) {
          console.error('Error during iOS PWA session refresh:', err);
        }
      }
    }, refreshInterval);
  }, [env.isIOSPwa, isListening, transcript, createTimeout, isMounted]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !browserSupportsSpeechRecognition) {
      console.error('Speech recognition not available');
      return;
    }
    
    setTranscript('');
    setInterimTranscript('');
    setError(undefined);
    retryAttemptsRef.current = 0;
    accumulatedTranscriptRef.current = '';
    
    try {
      const recognition = recognitionRef.current;
      
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
        
        if (isListening && isMounted()) {
          console.log('Restarting speech recognition...');
          
          if (env.isIOSPwa) {
            accumulatedTranscriptRef.current += ' ' + transcript;
            
            createTimeout(() => {
              try {
                recognition.start();
              } catch (err) {
                console.error('Error restarting iOS recognition:', err);
                
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
      
      recognition.start();
      setIsListening(true);
      
      if (env.isIOSPwa) {
        console.log('iOS PWA detected: Setting up shorter session duration');
        const iosPwaSessionTime = 8000;
        
        createTimeout(() => {
          if (isListening && isMounted()) {
            console.log('iOS PWA auto-stop triggered after 8 seconds');
            accumulatedTranscriptRef.current += ' ' + transcript;
            stopListening();
          }
        }, iosPwaSessionTime);
      }
      
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
    env,
    stopListening,
    setupIOSPwaSessionRefresh
  ]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);

  const getCompleteTranscript = useCallback(() => {
    if (env.isIOSPwa) {
      const complete = (accumulatedTranscriptRef.current + ' ' + transcript)
        .replace(/\s+/g, ' ')
        .trim();
        
      console.log(`Complete transcript: ${complete.substring(0, 50)}... (${complete.length} chars)`);
      
      accumulatedTranscriptRef.current = '';
      return complete;
    }
    return transcript;
  }, [env.isIOSPwa, transcript]);

  const environmentInfo = useMemo(() => {
    return {
      isIOS: env.isIOS,
      isIOSPwa: env.isIOSPwa,
      isMobile: env.isMobile,
      isPwa: env.isPwa,
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
