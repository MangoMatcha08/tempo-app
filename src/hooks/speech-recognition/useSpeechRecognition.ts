import { useState, useEffect, useCallback, useRef } from 'react';
import { UseSpeechRecognitionReturn } from './types';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { useTranscriptState } from './useTranscriptState';
import { isRunningAsPwa } from './utils';
import { detectEnvironment, EnvironmentConfig } from './environmentDetection';
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
  const [environmentConfig] = useState<EnvironmentConfig>(() => detectEnvironment());
  const isMountedRef = useRef(true);
  const { createTimeout, clearAllTimeouts, clearTrackedTimeout } = useTrackedTimeouts();
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);
  
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
  
  useEffect(() => {
    if (!recognition) return;
    
    recognition.onresult = (event: any) => {
      processSpeechResults(event);
      setRestartAttempts(0);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error, event);
      
      if (!isMountedRef.current) return;
      
      const errorMessages = {
        'not-allowed': 'Microphone access was denied. Please enable microphone access in your browser settings.',
        'audio-capture': 'No microphone was found or microphone is already in use.',
        'network': 'Network error occurred. Please check your internet connection.',
        'aborted': 'Speech recognition was aborted.',
        'no-speech': 'No speech was detected. Please try speaking louder or check your microphone.',
        'service-not-allowed': 'Speech recognition service not allowed. Try reloading the page.',
      };
      
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
        return;
      }
      
      if (event.error === 'not-allowed') {
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        setIsListening(false);
        return;
      }
      
      if (isPwaEnvironment && ['network', 'service-not-allowed'].includes(event.error)) {
        console.log(`PWA environment detected with ${event.error} error, using extended recovery`);
        
        setError(`Speech recognition error. ${
          restartAttempts > 1 ? 'Multiple errors encountered. ' : ''
        }Please try again in a moment.`);
        
        setRestartAttempts(prev => {
          const newCount = prev + 1;
          
          if (newCount >= 3) {
            setIsListening(false);
            console.log('Too many restart attempts, stopping recognition');
            
            createTimeout(() => {
              setError(undefined);
              setRestartAttempts(0);
            }, 3000);
          }
          
          return newCount;
        });
        
        return;
      }
      
      if (event.error === 'network') {
        console.log('Network error, attempting to restart recognition...');
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        
        const timeout = Math.min(1000 * (1 + restartAttempts), 5000);
        console.log(`Will attempt restart in ${timeout}ms (attempt ${restartAttempts + 1})`);
        
        createTimeout(() => {
          if (isListening && isMountedRef.current) {
            try {
              recognition.start();
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
      
      setError(errorMessages[event.error as keyof typeof errorMessages] || `Speech recognition error: ${event.error}`);
      
      if (['not-allowed', 'audio-capture', 'service-not-allowed'].includes(event.error)) {
        setIsListening(false);
      }
    };
    
    return () => {
      if (recognition) {
        try {
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;
          
          recognition.stop();
        } catch (err) {
          console.error('Error stopping recognition during cleanup:', err);
        }
      }
      
      clearAllTimeouts();
    };
  }, [recognition, isListening, processSpeechResults, isPwaEnvironment, restartAttempts, createTimeout, clearAllTimeouts]);

  const startIOSPwaRecording = useCallback(() => {
    if (!recognition || !isMountedRef.current) return false;
    
    console.log("Starting iOS PWA specialized recording strategy");
    
    const maxSessionLength = 8000;
    let accumulatedTranscript = '';
    let sessionTimeoutId: number | undefined;
    
    recognition.continuous = false;
    
    const manageIOSSession = () => {
      if (!isMountedRef.current || !isListening) return;
      
      try {
        recognition.start();
        console.log('Started iOS PWA recognition session');
        
        sessionTimeoutId = createTimeout(() => {
          if (isListening && isMountedRef.current) {
            try {
              accumulatedTranscript += ' ' + transcript;
              
              recognition.stop();
              console.log('iOS session stopped, preparing to restart');
              
              createTimeout(() => {
                if (isListening && isMountedRef.current) {
                  manageIOSSession();
                }
              }, 300);
            } catch (err) {
              console.error('Error during iOS session switch:', err);
              
              if (isListening && isMountedRef.current) {
                createTimeout(manageIOSSession, 1000);
              }
            }
          }
        }, maxSessionLength);
      } catch (err) {
        console.error('Error in iOS PWA session:', err);
        
        if (isListening && isMountedRef.current) {
          createTimeout(manageIOSSession, 1500);
        }
      }
    };
    
    manageIOSSession();
    return true;
  }, [recognition, transcript, isListening, createTimeout]);

  const startListening = useCallback(() => {
    if (!recognition || !isMountedRef.current) return;
    
    resetTranscriptState();
    setError(undefined);
    setRestartAttempts(0);
    
    setIsListening(true);
    try {
      if (environmentConfig?.isIOSPwa) {
        console.log("Using iOS PWA-specific recognition strategy");
        startIOSPwaRecording();
      } else {
        recognition.start();
      }
      
      console.log('Speech recognition started');
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Recognition error on start:', err);
      
      try {
        recognition.stop();
        const restartDelay = isPwaEnvironment ? 500 : 100;
        console.log(`Attempting restart with ${restartDelay}ms delay (isPwa: ${isPwaEnvironment})`);
        
        createTimeout(() => {
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

  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    console.log('Stopping speech recognition');
    setIsListening(false);
    
    try {
      setRestartAttempts(0);
      
      if (recognition.onend) {
        const originalOnEnd = recognition.onend;
        recognition.onend = null;
        
        recognition.stop();
        console.log('Speech recognition stopped');
        
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

  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript: resetTranscriptState,
    browserSupportsSpeechRecognition,
    error,
    isPwa: isPwaEnvironment,
    environmentConfig
  };
};

export default useSpeechRecognition;
