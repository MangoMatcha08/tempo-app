
import { useRef, useEffect, useMemo } from 'react';
import { isRunningAsPwa } from './utils';
import { detectEnvironment } from './environmentDetection';

interface SetupOptions {
  onError: (error: string | undefined) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

export const useSpeechRecognitionSetup = ({ onError, isListening, setIsListening }: SetupOptions) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const environmentConfig = useMemo(() => detectEnvironment(), []);
  const isPwa = useMemo(() => isRunningAsPwa(), []);
  
  // Set up speech recognition
  useEffect(() => {
    // Check if the browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported by this browser');
      return;
    }
    
    try {
      // Create a new SpeechRecognition instance
      recognitionRef.current = new SpeechRecognition();
      
      // Configure based on environment
      const recognition = recognitionRef.current;
      
      // Set recognition parameters based on environment configuration
      recognition.continuous = environmentConfig.recognitionConfig.continuous;
      recognition.interimResults = environmentConfig.recognitionConfig.interimResults;
      recognition.maxAlternatives = environmentConfig.recognitionConfig.maxAlternatives;
      
      // Set language based on browser preference or fallback to English
      try {
        recognition.lang = navigator.language || 'en-US';
      } catch (err) {
        recognition.lang = 'en-US';
      }
      
      // Configure onend behavior
      recognition.onend = () => {
        console.log('SpeechRecognition ended');
        
        // Only auto-restart if we're still supposed to be listening 
        // and not in iOS PWA (which has specialized handling)
        if (isListening && !environmentConfig.isIOSPwa) {
          console.log('Auto-restarting recognition...');
          
          try {
            const restartDelay = environmentConfig.recognitionConfig.restartDelay;
            setTimeout(() => {
              if (isListening) {
                try {
                  recognition.start();
                  console.log('Recognition restarted');
                } catch (startErr) {
                  console.error('Failed to restart recognition:', startErr);
                  setIsListening(false);
                  onError('Failed to restart recognition');
                }
              }
            }, restartDelay);
          } catch (err) {
            console.error('Error in recognition onend handler:', err);
            setIsListening(false);
          }
        } else if (!isListening) {
          console.log('Recognition ended and not restarting (isListening=false)');
        }
      };
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      onError('Speech recognition failed to initialize');
    }
    
    return () => {
      // Cleanup when component unmounts
      if (recognitionRef.current && isListening) {
        try {
          console.log('Stopping recognition during cleanup');
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping recognition during cleanup:', err);
        }
      }
    };
  }, [onError, environmentConfig, isListening, setIsListening, isPwa]);
  
  const browserSupportsSpeechRecognition = Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
  
  return {
    recognition: recognitionRef.current,
    browserSupportsSpeechRecognition,
    isPwa,
    environmentConfig
  };
};
