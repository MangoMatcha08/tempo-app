
import { useState, useEffect } from 'react';
import { 
  createSpeechRecognition, 
  configureSpeechRecognition,
  isSpeechRecognitionSupported,
  isIOSDevice,
  isHighLatencyEnvironment,
  SpeechRecognitionOptions
} from './utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("SpeechRecognitionSetup");

interface UseSpeechRecognitionSetupProps {
  onError: (error: string | undefined) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

// IMPROVEMENT 3: Robust Recognition State Management
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
  
  // Enhanced platform detection
  useEffect(() => {
    // Check if app is running in standalone mode (PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
      window.navigator.standalone === true;
    
    setIsPWA(isStandalone);
    setIsIOS(isIOSDevice());
    setIsHighLatency(isHighLatencyEnvironment());
    
    debugLog("Platform detection:", {
      isPWA: isStandalone,
      isMobile,
      isIOS: isIOSDevice(),
      isHighLatency: isHighLatencyEnvironment()
    });
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
          isHighLatency: isHighLatency,
          isPWA: isPWA,
          isMobile: isMobile,
          isIOS: isIOS
        };
        
        configureSpeechRecognition(recognitionInstance, options);
        debugLog("Configured recognition with options:", options);
        
        // Enhanced onend handler with better mobile/PWA support
        recognitionInstance.onend = () => {
          debugLog('Speech recognition ended, isListening:', isListening);
          
          // Only restart if still supposed to be listening
          if (isListening) {
            debugLog('Restarting speech recognition...');
            try {
              // Platform-specific restart delay
              const restartDelay = isPWA ? 1000 : (isMobile ? 800 : 300);
              debugLog(`Using restart delay of ${restartDelay}ms`);
              
              setTimeout(() => {
                if (isListening) {
                  try {
                    recognitionInstance.start();
                    debugLog("Recognition restarted after timeout");
                  } catch (startErr) {
                    debugLog(`Error on restart: ${startErr}`);
                    
                    // Special handling for iOS Safari which can be finicky
                    if (isIOS) {
                      debugLog("iOS detected, using special restart approach");
                      setTimeout(() => {
                        try {
                          if (isListening) {
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
          
          // Handle specific error types differently
          if (event.error === 'aborted' && isListening) {
            debugLog("Aborted error during active listening - attempting recovery");
            setTimeout(() => {
              if (isListening) {
                try {
                  recognitionInstance.start();
                  debugLog("Recovery successful after aborted error");
                } catch (startErr) {
                  debugLog(`Recovery failed: ${startErr}`);
                }
              }
            }, isPWA ? 1200 : 600);
          }
        };
        
        // Add an onstart handler for better debugging
        recognitionInstance.onstart = () => {
          debugLog("Recognition started successfully");
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
