
import { useState, useEffect, useRef, useCallback } from 'react';
import { UseSpeechRecognitionReturn, SpeechRecognitionConfig } from './types';
import { createDebugLogger } from '@/utils/debugUtils';
import { 
  isPwaMode, 
  isIOSDevice, 
  isMobileDevice,
  prewarmSpeechRecognition
} from './utils';
import { useTranscriptState } from './useTranscriptState';

const debugLog = createDebugLogger("SpeechRecognition");

/**
 * Custom hook for speech recognition
 */
const useSpeechRecognition = (
  config?: SpeechRecognitionConfig
): UseSpeechRecognitionReturn => {
  // State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState<boolean>(false);
  
  // Environment detection
  const isPWA = isPwaMode();
  const isIOS = isIOSDevice();
  const isMobile = isMobileDevice();
  
  // References
  const recognition = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Setup transcript state
  const transcriptState = useTranscriptState({ isPWA, isIOS });
  
  // Setup recognition instance
  useEffect(() => {
    // Check if browser supports speech recognition
    const isSpeechRecognitionSupported = 
      'SpeechRecognition' in window || 
      'webkitSpeechRecognition' in window;
    
    if (isSpeechRecognitionSupported) {
      try {
        // Get appropriate constructor
        const SpeechRecognition = 
          window.SpeechRecognition || 
          window.webkitSpeechRecognition;
        
        // Create recognition instance
        recognition.current = new SpeechRecognition();
        
        // Configure recognition
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.lang = navigator.language || 'en-US';
        
        // Special handling for iOS PWA mode
        if (isIOS && isPWA) {
          recognition.current.continuous = false;
          debugLog("Adjusted for iOS PWA: using non-continuous mode");
        }
        
        // Set recognition event handlers
        recognition.current.onresult = transcriptState.processSpeechResults;
        
        recognition.current.onerror = (event: any) => {
          debugLog(`Recognition error: ${event.error}`);
          
          // Don't treat no-speech as a critical error
          if (event.error === 'no-speech') return;
          
          if (config?.onError) {
            config.onError(`Speech recognition error: ${event.error}`);
          }
          
          setError(`Speech recognition error: ${event.error}`);
          
          // If permission is denied, update listening state
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            if (config?.setIsListening) {
              config.setIsListening(false);
            } else {
              setIsListening(false);
            }
          }
        };
        
        recognition.current.onend = () => {
          debugLog("Recognition ended");
          
          // Update listening state
          if (config?.setIsListening) {
            config.setIsListening(false);
          } else {
            setIsListening(false);
          }
          
          // If still listening, attempt to restart
          if (isListening) {
            debugLog("Recognition ended but still listening, attempting restart");
            
            // Delay restart slightly
            restartTimeoutRef.current = setTimeout(() => {
              try {
                recognition.current.start();
                debugLog("Restarted recognition");
              } catch (err) {
                debugLog(`Failed to restart recognition: ${err}`);
              }
            }, 300);
          }
        };
        
        setBrowserSupportsSpeechRecognition(true);
        debugLog("Speech recognition initialized successfully");
        
        // Prewarm for future use
        prewarmSpeechRecognition();
      } catch (err) {
        console.error("Failed to initialize speech recognition:", err);
        setBrowserSupportsSpeechRecognition(false);
        setError(`Failed to initialize speech recognition: ${err}`);
      }
    } else {
      debugLog("Speech recognition not supported in this browser");
      setBrowserSupportsSpeechRecognition(false);
      setError('Your browser does not support speech recognition');
    }
    
    // Cleanup
    return () => {
      if (recognition.current) {
        try {
          recognition.current.onresult = null;
          recognition.current.onerror = null;
          recognition.current.onend = null;
          
          if (isListening) {
            recognition.current.stop();
          }
        } catch (err) {
          console.error("Error cleaning up speech recognition:", err);
        }
      }
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);
  
  // Method to start listening
  const startListening = useCallback(async () => {
    if (!recognition.current) {
      setError('Speech recognition not available');
      return;
    }
    
    try {
      debugLog("Starting speech recognition");
      setError(undefined);
      
      // Reset transcript
      transcriptState.resetTranscriptState();
      
      // Start recognition
      recognition.current.start();
      
      // Update listening state
      if (config?.setIsListening) {
        config.setIsListening(true);
      } else {
        setIsListening(true);
      }
      
      debugLog("Speech recognition started successfully");
    } catch (err) {
      debugLog(`Error starting speech recognition: ${err}`);
      
      // Handle "already started" error
      if (err instanceof Error && err.message.includes('already started')) {
        debugLog("Recognition already started");
        
        if (config?.setIsListening) {
          config.setIsListening(true);
        } else {
          setIsListening(true);
        }
      } else {
        setError(`Could not start speech recognition: ${err}`);
      }
    }
  }, [config, transcriptState]);
  
  // Method to stop listening
  const stopListening = useCallback(() => {
    if (!recognition.current) return;
    
    try {
      debugLog("Stopping speech recognition");
      recognition.current.stop();
      
      // Update listening state
      if (config?.setIsListening) {
        config.setIsListening(false);
      } else {
        setIsListening(false);
      }
      
      debugLog("Speech recognition stopped successfully");
    } catch (err) {
      debugLog(`Error stopping speech recognition: ${err}`);
      setError(`Could not stop speech recognition: ${err}`);
    }
  }, [config]);
  
  // Method to reset transcript
  const resetTranscript = useCallback(() => {
    transcriptState.resetTranscriptState();
  }, [transcriptState]);
  
  // Sync listening state with config
  useEffect(() => {
    if (config?.isListening !== undefined && isListening !== config.isListening) {
      setIsListening(config.isListening);
    }
  }, [config?.isListening, isListening]);
  
  // Return the hook interface
  return {
    transcript: transcriptState.transcript,
    interimTranscript: transcriptState.interimTranscript,
    isListening: config?.isListening !== undefined ? config.isListening : isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error,
    isPWA,
    isMobile
  };
};

export default useSpeechRecognition;
