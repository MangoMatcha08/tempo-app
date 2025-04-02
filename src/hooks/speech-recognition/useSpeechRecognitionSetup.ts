
import { useState, useEffect } from 'react';
import { 
  createSpeechRecognition, 
  configureSpeechRecognition,
  isSpeechRecognitionSupported
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
  const [isPWA, setIsPWA] = useState(false);
  
  // Check if running as PWA
  useEffect(() => {
    // Check if app is running in standalone mode (PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
      window.navigator.standalone === true;
    
    setIsPWA(isStandalone);
    console.log("Running as PWA:", isStandalone);
  }, []);
  
  // Initialize speech recognition
  useEffect(() => {
    // Check browser support first
    const isSupported = isSpeechRecognitionSupported();
    setBrowserSupportsSpeechRecognition(isSupported);
    console.log("Speech recognition supported:", isSupported);
    
    if (!isSupported) {
      onError('Your browser does not support speech recognition.');
      return;
    }
    
    // Create recognition instance with improved error handling
    try {
      const recognitionInstance = createSpeechRecognition();
      console.log("Created recognition instance:", !!recognitionInstance);
      
      if (recognitionInstance) {
        // Configure with better settings for mobile/PWA
        configureSpeechRecognition(recognitionInstance, isMobile || isPWA);
        
        // Handle recognition end event with better restart logic
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended, isListening:', isListening);
          
          // Only restart if still supposed to be listening
          if (isListening) {
            console.log('Restarting speech recognition...');
            try {
              // Longer timeout on mobile or in PWA to reduce battery usage and ensure proper restart
              setTimeout(() => {
                if (isListening) {
                  recognitionInstance.start();
                  console.log("Recognition restarted after timeout");
                }
              }, (isMobile || isPWA) ? 500 : 100);
            } catch (err) {
              console.error('Error restarting recognition:', err);
              onError('Failed to restart speech recognition. Please try again.');
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
      onError('Failed to initialize speech recognition.');
    }
  }, [onError, setIsListening, isMobile, isPWA]);

  return {
    recognition,
    browserSupportsSpeechRecognition,
    isPWA
  };
};
