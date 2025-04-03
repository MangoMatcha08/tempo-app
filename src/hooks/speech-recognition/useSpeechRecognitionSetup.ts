
import { useState, useEffect, useRef } from 'react';
import { 
  createSpeechRecognition, 
  configureSpeechRecognition,
  isSpeechRecognitionSupported,
  isIOSDevice,
  isHighLatencyEnvironment,
  isPwaMode,
  SpeechRecognitionOptions,
  ensureActiveAudioStream
} from './utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("SpeechRecognitionSetup");

interface UseSpeechRecognitionSetupProps {
  onError: (error: string | undefined) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

// Enhanced Recognition State Management
export const useSpeechRecognitionSetup = ({
  onError,
  isListening,
  setIsListening
}: UseSpeechRecognitionSetupProps) => {
  const [recognition, setRecognition] = useState<any | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isHighLatency, setIsHighLatency] = useState(false);
  const hasAudioStartedRef = useRef(false);
  const recoveryAttemptsRef = useRef(0);
  const iosStreamEstablishedRef = useRef(false);
  
  // Enhanced platform detection
  useEffect(() => {
    const ios = isIOSDevice();
    const pwa = isPwaMode();
    const highLatency = isHighLatencyEnvironment();
    
    setIsPWA(pwa);
    setIsIOS(ios);
    setIsHighLatency(highLatency);
    
    debugLog("Platform detection:", {
      isPWA: pwa,
      isMobile,
      isIOS: ios,
      isHighLatency: highLatency
    });
    
    // For iOS PWA, preemptively request audio permission
    if (ios && pwa && !iosStreamEstablishedRef.current) {
      debugLog("iOS PWA detected, preemptively requesting audio permission");
      setTimeout(async () => {
        const success = await ensureActiveAudioStream();
        iosStreamEstablishedRef.current = success;
        debugLog(`iOS audio stream ${success ? 'established' : 'failed'}`);
      }, 500);
    }
  }, [isMobile]);
  
  // Initialize speech recognition with platform-aware configuration
  useEffect(() => {
    // Check browser support first
    const isSupported = isSpeechRecognitionSupported();
    setBrowserSupportsSpeechRecognition(isSupported);
    debugLog("Speech recognition supported:", isSupported);
    
    if (!isSupported) {
      onError('Your browser does not support speech recognition.');
      return;
    }
    
    // Create recognition instance with improved error handling
    try {
      const recognitionInstance = createSpeechRecognition();
      debugLog("Created recognition instance:", !!recognitionInstance);
      
      if (recognitionInstance) {
        // Enhanced configuration with platform-specific settings
        const options: SpeechRecognitionOptions = {
          isHighLatency,
          isPWA,
          isMobile,
          isIOS
        };
        
        configureSpeechRecognition(recognitionInstance, options);
        debugLog("Configured recognition with options:", options);
        
        // iOS-optimized handlers
        recognitionInstance.onstart = (event: any) => {
          debugLog("Recognition started event received");
          setIsListening(true);
          hasAudioStartedRef.current = false; // Reset audio flag
          recoveryAttemptsRef.current = 0; // Reset recovery attempts
        };
        
        recognitionInstance.onaudiostart = (event: any) => {
          debugLog("Audio capturing started");
          // Important iOS flag - tracks if audio capture actually began
          hasAudioStartedRef.current = true;
        };
        
        // Enhanced onend handler with better mobile/PWA support
        recognitionInstance.onend = () => {
          debugLog('Speech recognition ended, isListening state:', isListening);
          
          // Only restart if still supposed to be listening
          if (isListening) {
            debugLog('Restarting speech recognition...');
            
            try {
              // Platform-specific restart delay - longer for iOS
              const restartDelay = isIOS ? 
                (isPWA ? 1500 : 1000) : 
                (isPWA ? 800 : 300);
              
              debugLog(`Using restart delay of ${restartDelay}ms for ${isIOS ? 'iOS' : 'non-iOS'}`);
              
              setTimeout(async () => {
                if (isListening) {
                  try {
                    if (isIOS && isPWA) {
                      // For iOS PWA, ensure we have an active audio stream before restarting
                      if (!iosStreamEstablishedRef.current) {
                        debugLog("iOS PWA: Reestablishing audio stream before restart");
                        iosStreamEstablishedRef.current = await ensureActiveAudioStream();
                      }
                      
                      // Force stop first (iOS needs this)
                      try {
                        recognitionInstance.stop();
                      } catch (e) {
                        // Ignore - may not be started
                      }
                      
                      // Add another delay for iOS before starting
                      setTimeout(() => {
                        try {
                          recognitionInstance.start();
                          debugLog("iOS PWA: Recognition restarted after stop-start sequence");
                        } catch (iosErr) {
                          debugLog(`iOS PWA restart failed: ${iosErr}`);
                          onError('Speech recognition failed. Please try again.');
                          setIsListening(false);
                        }
                      }, 300);
                    } else {
                      // Standard restart for other platforms
                      recognitionInstance.start();
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
                            iosStreamEstablishedRef.current = await ensureActiveAudioStream();
                            
                            recognitionInstance.start();
                            debugLog("iOS special restart successful");
                          }
                        } catch (iosErr) {
                          debugLog(`iOS restart failed: ${iosErr}`);
                          onError('Speech recognition failed. Please try again.');
                          setIsListening(false);
                        }
                      }, 1200);
                    } else {
                      onError('Failed to restart speech recognition. Please try again.');
                      setIsListening(false);
                    }
                  }
                } else {
                  debugLog("Not restarting - no longer listening");
                }
              }, restartDelay);
            } catch (err) {
              console.error('Error restarting recognition:', err);
              debugLog(`Error restarting recognition: ${err}`);
              onError('Failed to restart speech recognition. Please try again.');
              setIsListening(false);
            }
          } else {
            debugLog("Not restarting - listening state is false");
          }
        };
        
        // Enhanced error handler for better recovery
        recognitionInstance.onerror = (event: any) => {
          debugLog(`Recognition error: ${event.error}, isListening: ${isListening}`);
          
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
            
            if (recoveryAttemptsRef.current < maxAttempts) {
              // Exponential backoff with jitter
              const backoffFactor = Math.min(Math.pow(1.5, recoveryAttemptsRef.current), 10);
              const jitter = Math.random() * 0.3 + 0.85;
              const backoffTime = Math.min(baseDelay * backoffFactor * jitter, 5000);
              
              debugLog(`Recovery attempt ${recoveryAttemptsRef.current + 1}/${maxAttempts} with delay ${backoffTime}ms`);
              
              setTimeout(async () => {
                if (isListening) {
                  try {
                    // For iOS, ensure we have an active audio stream
                    if (isIOS) {
                      iosStreamEstablishedRef.current = await ensureActiveAudioStream();
                    }
                    
                    try {
                      recognitionInstance.stop();
                    } catch (e) {
                      // Ignore - may not be started
                    }
                    
                    setTimeout(() => {
                      try {
                        recognitionInstance.start();
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
              
              recoveryAttemptsRef.current++;
            } else {
              debugLog("Max recovery attempts reached");
              onError('Recognition failed after multiple attempts. Please try again.');
              setIsListening(false);
            }
          }
        };
        
        setRecognition(recognitionInstance);
      } else {
        onError('Failed to initialize speech recognition.');
      }
    } catch (error) {
      console.error('Error setting up speech recognition:', error);
      debugLog(`Error setting up speech recognition: ${error}`);
      onError('Failed to initialize speech recognition.');
    }
    
    // Cleanup function
    return () => {
      debugLog("Cleaning up speech recognition");
      if (recognition) {
        try {
          recognition.stop();
          debugLog("Recognition stopped during cleanup");
        } catch (err) {
          debugLog(`Error stopping during cleanup: ${err}`);
        }
      }
    };
  }, [onError, setIsListening, isMobile, isPWA, isListening, isIOS, isHighLatency]);

  return {
    recognition,
    browserSupportsSpeechRecognition,
    isPWA,
    isMobile,
    isIOS
  };
};
