
import { useState, useEffect, useRef } from 'react';
import { 
  createSpeechRecognition, 
  configureSpeechRecognition,
  isSpeechRecognitionSupported,
  retryWithBackoff,
  isRunningAsPwa
} from './utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseSpeechRecognitionSetupProps {
  onError: (error: string | undefined) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

export const useSpeechRecognitionSetup = ({
  onError,
  isListening,
  setIsListening
}: UseSpeechRecognitionSetupProps) => {
  const [recognition, setRecognition] = useState<any | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const isPwa = isRunningAsPwa();
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);
  
  // Clean up function to clear all timeouts
  const clearTimeouts = () => {
    timeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutsRef.current = [];
  };
  
  // Set mounted flag for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      clearTimeouts();
    };
  }, []);
  
  // Helper to create safe timeouts that are tracked and cleaned up
  const createSafeTimeout = (callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      // Remove from tracking array
      timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
      
      // Only call if component is mounted
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    
    // Add to tracking array
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  };
  
  // Initialize speech recognition
  useEffect(() => {
    // Check browser support first
    const isSupported = isSpeechRecognitionSupported();
    setBrowserSupportsSpeechRecognition(isSupported);
    
    if (!isSupported) {
      onError('Your browser does not support speech recognition.');
      return;
    }
    
    // Create recognition instance with improved error handling
    try {
      const recognitionInstance = createSpeechRecognition();
      
      if (recognitionInstance) {
        // Configure with better settings for mobile/PWA
        configureSpeechRecognition(recognitionInstance, isMobile);
        
        // Handle recognition end event with better restart logic
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended, isListening:', isListening);
          
          // Only restart if still supposed to be listening and component is mounted
          if (isListening && isMountedRef.current) {
            console.log('Restarting speech recognition...');
            try {
              // Longer timeout on mobile/PWA to reduce battery usage and address timing issues
              // PWA environments need even more time to recover between recognition sessions
              const timeoutDuration = isPwa ? 800 : (isMobile ? 500 : 150);
              
              console.log(`Using ${timeoutDuration}ms timeout before restart (isPwa: ${isPwa}, isMobile: ${isMobile})`);
              
              // Use the safe timeout implementation
              createSafeTimeout(() => {
                // Double-check that we're still listening and mounted
                if (isListening && isMountedRef.current) {
                  try {
                    recognitionInstance.start();
                    console.log('Successfully restarted speech recognition');
                  } catch (startErr) {
                    console.error('Error on scheduled restart:', startErr);
                    
                    // Use retry with backoff for PWA environments
                    if (isMountedRef.current) {
                      retryWithBackoff(
                        () => recognitionInstance.start(),
                        isPwa ? 5 : 3,  // More retries for PWA
                        isPwa ? 500 : 300  // Longer base delay for PWA
                      ).catch(backoffErr => {
                        // Only update state if still mounted
                        if (isMountedRef.current) {
                          console.error('All retries failed:', backoffErr);
                          onError('Failed to restart speech recognition after multiple attempts. Please try again.');
                          setIsListening(false);
                        }
                      });
                    }
                  }
                } else {
                  console.log('No longer listening or component unmounted, skipping restart');
                }
              }, timeoutDuration);
            } catch (err) {
              console.error('Error scheduling recognition restart:', err);
              
              // Only update if still mounted
              if (isMountedRef.current) {
                onError('Failed to restart speech recognition. Please try again.');
                setIsListening(false);
              }
            }
          } else {
            console.log('Not restarting speech recognition as isListening is false or component unmounted');
          }
        };
        
        setRecognition(recognitionInstance);
      } else {
        onError('Failed to initialize speech recognition.');
      }
    } catch (error) {
      console.error('Error setting up speech recognition:', error);
      onError('Failed to initialize speech recognition.');
    }
    
    // Cleanup function
    return () => {
      clearTimeouts();
      
      if (recognition) {
        try {
          console.log('Cleaning up speech recognition');
          // Remove all event listeners first
          if (recognition.onresult) recognition.onresult = null;
          if (recognition.onerror) recognition.onerror = null;
          if (recognition.onend) recognition.onend = null;
          
          recognition.abort();  // More forceful than stop()
        } catch (err) {
          console.error('Error during speech recognition cleanup:', err);
        }
      }
    };
  }, [onError, setIsListening, isMobile, isPwa]);

  return {
    recognition,
    browserSupportsSpeechRecognition,
    isPwa
  };
};
