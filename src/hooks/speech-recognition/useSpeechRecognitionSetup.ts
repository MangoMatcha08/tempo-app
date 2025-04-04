
import { useState, useEffect, useRef } from 'react';
import { SpeechRecognitionConfig } from './types';
import { createDebugLogger } from '@/utils/debugUtils';
import { prewarmSpeechRecognition, getPrewarmedSpeechRecognition } from './utils';

const debugLog = createDebugLogger("SpeechRecognitionSetup");

// Hook to set up and manage speech recognition instance
export const useSpeechRecognitionSetup = ({
  onError,
  isListening,
  setIsListening
}: SpeechRecognitionConfig) => {
  const [recognition, setRecognition] = useState<any | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState<boolean>(false);
  
  // Reference to track if we've already initialized
  const hasInitializedRef = useRef<boolean>(false);
  
  // Initialize speech recognition
  useEffect(() => {
    // Skip if already initialized
    if (hasInitializedRef.current) return;
    
    // Check if the browser supports speech recognition
    const isSpeechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    
    if (isSpeechRecognitionSupported) {
      debugLog("Speech recognition is supported in this browser");
      
      try {
        // Try to get a prewarmed instance first
        let recognitionInstance = getPrewarmedSpeechRecognition();
        
        // If no prewarmed instance, create a new one
        if (!recognitionInstance) {
          debugLog("No prewarmed instance found, creating new instance");
          
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          recognitionInstance = new SpeechRecognition();
          
          // Configure recognition instance
          recognitionInstance.continuous = true;
          recognitionInstance.interimResults = true;
          recognitionInstance.maxAlternatives = 1;
          recognitionInstance.lang = navigator.language || 'en-US';
        } else {
          debugLog("Using prewarmed speech recognition instance");
        }
        
        // Store the recognition instance
        setRecognition(recognitionInstance);
        setBrowserSupportsSpeechRecognition(true);
        
        // Set up error handler
        recognitionInstance.onerror = (event: any) => {
          debugLog(`Recognition error: ${event.error}`);
          
          // Only report critical errors
          if (event.error !== 'no-speech') {
            if (onError) onError(`Speech recognition error: ${event.error}`);
            
            // Update listening state for critical errors
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              if (setIsListening) setIsListening(false);
            }
          }
        };
        
        // Set up end handler
        recognitionInstance.onend = () => {
          debugLog("Recognition ended");
          
          // Update listening state
          if (setIsListening && isListening) {
            setIsListening(false);
          }
        };
        
        debugLog("Speech recognition initialized successfully");
      } catch (error) {
        debugLog(`Error initializing speech recognition: ${error}`);
        setBrowserSupportsSpeechRecognition(false);
        if (onError) onError(`Failed to initialize speech recognition: ${error}`);
      }
    } else {
      debugLog("Speech recognition is not supported in this browser");
      setBrowserSupportsSpeechRecognition(false);
      if (onError) onError('Your browser does not support speech recognition');
    }
    
    // Mark as initialized
    hasInitializedRef.current = true;
    
    // Prewarm a new instance for next time
    prewarmSpeechRecognition();
    
    // Cleanup on unmount
    return () => {
      // Nothing to clean up for the recognition instance itself
      // (it will be cleaned up when stopped)
    };
  }, [onError, isListening, setIsListening]);
  
  return {
    recognition,
    browserSupportsSpeechRecognition
  };
};
