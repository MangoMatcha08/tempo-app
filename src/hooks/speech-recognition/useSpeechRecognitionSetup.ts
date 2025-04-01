
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
    const recognitionInstance = createSpeechRecognition();
    
    if (recognitionInstance) {
      configureSpeechRecognition(recognitionInstance);
      
      recognitionInstance.onend = () => {
        console.log('Speech recognition ended, isListening:', isListening);
        
        // If still supposed to be listening, restart recognition
        if (isListening) {
          console.log('Restarting speech recognition...');
          try {
            recognitionInstance.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
            onError('Failed to restart speech recognition. Please try again.');
            setIsListening(false);
          }
        }
      };
      
      setRecognition(recognitionInstance);
      setBrowserSupportsSpeechRecognition(true);
    } else {
      onError('Your browser does not support speech recognition.');
      setBrowserSupportsSpeechRecognition(false);
    }
  }, [isListening, onError, setIsListening]);

  return {
    recognition,
    browserSupportsSpeechRecognition
  };
};
