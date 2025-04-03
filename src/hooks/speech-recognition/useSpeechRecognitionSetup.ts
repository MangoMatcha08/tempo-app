
import { useRef, useEffect, useCallback } from 'react';
import { isPwaMode, isIOSDevice } from './utils';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("SpeechRecognitionSetup");

interface UseSpeechRecognitionSetupProps {
  onError: (error: string | undefined) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

interface UseSpeechRecognitionSetupReturn {
  recognition: any;
  browserSupportsSpeechRecognition: boolean;
  isPWA: boolean;
  isIOS: boolean;
}

// Separate setup hook to create and configure the recognition object
export const useSpeechRecognitionSetup = ({
  onError,
  isListening,
  setIsListening
}: UseSpeechRecognitionSetupProps): UseSpeechRecognitionSetupReturn => {
  const recognitionRef = useRef<any>(null);
  
  // Detect environment
  const isPWA = isPwaMode();
  const isIOS = isIOSDevice();
  
  debugLog(`Environment detected: isPWA=${isPWA}, isIOS=${isIOS}`);
  
  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      debugLog("Recognition object already exists, reusing");
      return recognitionRef.current;
    }
    
    try {
      // Get the appropriate speech recognition constructor
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        debugLog("Speech recognition not supported in this browser");
        return null;
      }
      
      // Create a new recognition instance
      const recognition = new SpeechRecognition();
      
      // Configure the recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      // iOS and PWA need special handling
      if (isIOS) {
        debugLog("iOS detected, applying iOS-specific configuration");
        // iOS needs non-continuous mode in some cases to work properly
        if (isPWA) {
          recognition.continuous = false;
          debugLog("iOS PWA: Set continuous to false for better compatibility");
        }
      }
      
      // Configure language (default to user's browser language or fall back to English)
      recognition.lang = navigator.language || 'en-US';
      
      debugLog(`Recognition configured: continuous=${recognition.continuous}, interimResults=${recognition.interimResults}, lang=${recognition.lang}`);
      
      recognitionRef.current = recognition;
      return recognition;
    } catch (error) {
      debugLog(`Error initializing speech recognition: ${error}`);
      onError(`Failed to initialize speech recognition: ${error}`);
      return null;
    }
  }, [onError, isIOS, isPWA]);
  
  // Initialize on mount
  useEffect(() => {
    const recognition = initSpeechRecognition();
    
    if (!recognition) {
      debugLog("Failed to initialize speech recognition");
      return;
    }
    
    // Set up diagnostic event handlers
    recognition.onstart = () => {
      debugLog("Recognition officially started");
    };
    
    recognition.onspeechstart = () => {
      debugLog("Speech detected, recognition is processing voice input");
    };
    
    recognition.onspeechend = () => {
      debugLog("Speech ended (user stopped speaking)");
    };
    
    recognition.onaudiostart = () => {
      debugLog("Audio capture has started successfully");
      // This confirms microphone access is working
    };
    
    recognition.onerror = (event: any) => {
      const errorMsg = `Recognition error: ${event.error}`;
      debugLog(errorMsg, event);
      
      // Don't treat no-speech as a critical error
      if (event.error === 'no-speech') {
        debugLog("No speech detected, but this is not a critical error");
        return;
      }
      
      // Handle specific errors
      switch (event.error) {
        case 'network':
          onError("Network error occurred. Check your internet connection.");
          break;
        case 'not-allowed':
        case 'service-not-allowed':
          onError("Microphone access was denied. Please allow microphone access and try again.");
          setIsListening(false);
          break;
        case 'aborted':
          debugLog("Recognition aborted");
          // Usually non-critical, don't report to user
          break;
        default:
          onError(`Speech recognition error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      debugLog("Recognition service disconnected");
      
      // Ensure state is synced properly if recognition ends without an explicit stop
      // but only if we haven't already transitioned the state with stopListening
      if (isListening) {
        debugLog("Recognition ended while still in listening state");
      }
    };
    
    return () => {
      // Cleanup - remove event handlers
      if (recognition) {
        recognition.onstart = null;
        recognition.onspeechstart = null;
        recognition.onspeechend = null;
        recognition.onaudiostart = null;
        recognition.onerror = null;
        recognition.onend = null;
        
        // Stop recognition if active
        if (isListening) {
          try {
            recognition.stop();
            debugLog("Recognition stopped during cleanup");
          } catch (e) {
            debugLog(`Error stopping recognition during cleanup: ${e}`);
          }
        }
      }
    };
  }, [initSpeechRecognition, onError, isListening, setIsListening]);
  
  // Check browser support
  const browserSupportsSpeechRecognition = !!window.SpeechRecognition || !!window.webkitSpeechRecognition;
  
  return {
    recognition: recognitionRef.current,
    browserSupportsSpeechRecognition,
    isPWA,
    isIOS
  };
};
