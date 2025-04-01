
import { useState, useEffect, useRef } from 'react';
import { 
  createSpeechRecognition, 
  configureSpeechRecognition,
  isSpeechRecognitionSupported
} from './utils';

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
        configureSpeechRecognition(recognitionInstance);
        
        // Handle recognition end event with better restart logic
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended, isListening:', isListening);
          
          // Only restart if still supposed to be listening
          if (isListening) {
            console.log('Restarting speech recognition...');
            try {
              // Small timeout to prevent rapid restart cycles
              setTimeout(() => {
                recognitionInstance.start();
              }, 100);
            } catch (err) {
              console.error('Error restarting recognition:', err);
              onError('Failed to restart speech recognition. Please try again.');
              setIsListening(false);
            }
          }
        };
        
        // Handle recognition errors more gracefully
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          // Handle specific error types
          switch (event.error) {
            case 'network':
              onError('Network error occurred. Please check your internet connection.');
              break;
            case 'not-allowed':
              onError('Microphone access was denied. Please allow microphone access.');
              break;
            case 'aborted':
              // This is often triggered by the user, so don't show an error
              console.log('Speech recognition aborted');
              break;
            default:
              onError(`Speech recognition error: ${event.error}`);
          }
          
          // Stop listening on critical errors
          if (['not-allowed', 'network'].includes(event.error)) {
            setIsListening(false);
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
  }, [onError, setIsListening]);

  return {
    recognition,
    browserSupportsSpeechRecognition
  };
};
