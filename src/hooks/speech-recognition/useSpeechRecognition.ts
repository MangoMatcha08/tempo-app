import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { useTranscriptState } from './useTranscriptState';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';
import { ensureActiveAudioStream, releaseAudioStream, isIOSDevice, isPwaMode } from './utils';
import { UseSpeechRecognitionReturn } from './types';

const debugLog = createDebugLogger("SpeechRecognition");

// Enhanced Speech Recognition Hook with iOS PWA support
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef<number>(0);
  
  // Detect iOS and PWA status
  const isIOS = isIOSDevice();
  const isPWA = isPwaMode();
  
  // Callback to handle errors
  const handleError = useCallback((newError: string | undefined) => {
    setError(newError);
  }, []);
  
  // Set up recognition with iOS-aware configuration
  const { 
    recognition,
    browserSupportsSpeechRecognition,
    isPWA: detectedIsPWA,
    isIOS: detectedIsIOS
  } = useSpeechRecognitionSetup({
    onError: handleError,
    isListening,
    setIsListening
  });
  
  // Improved transcript state management with iOS optimizations
  const { 
    transcript, 
    interimTranscript,
    isProcessing,
    resetTranscriptState,
    processSpeechResults
  } = useTranscriptState({ isPWA: detectedIsPWA, isIOS: detectedIsIOS });
  
  // Enhanced result handler with iOS-specific optimizations
  useEffect(() => {
    if (!recognition) return;
    
    const handleResults = (event: any) => {
      if (isListening) {
        processSpeechResults(event);
      }
    };
    
    recognition.onresult = handleResults;
    
    return () => {
      if (recognition) {
        recognition.onresult = null;
      }
    };
  }, [recognition, isListening, processSpeechResults]);
  
  // Enhanced start listening function with iOS-specific handling
  const startListening = useCallback(async () => {
    if (!recognition) {
      setError("Speech recognition not available");
      return;
    }
    
    debugLog(`Starting speech recognition. Is iOS: ${isIOS}, Is PWA: ${isPWA}`);
    
    // Clear any previous start timeouts
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    
    // Reset the transcript
    resetTranscriptState();
    setError(undefined);
    attemptCountRef.current = 0;
    
    // iOS-specific pre-start sequence
    if (isIOS) {
      debugLog("iOS detected, using special start sequence");
      
      try {
        // For iOS, ensure we have an active audio stream first
        const hasPermission = await ensureActiveAudioStream();
        
        if (!hasPermission) {
          setError("Microphone permission is required");
          return;
        }
        
        // Force stop any existing recognition
        try {
          recognition.stop();
          debugLog("Stopped any existing recognition");
        } catch (e) {
          // Ignore - may not be started
        }
        
        // Set listening state to true
        setIsListening(true);
        
        // Add critical delay for iOS before starting
        const startDelay = isPWA ? 500 : 300; // Longer for PWA on iOS
        
        debugLog(`Adding iOS-specific delay of ${startDelay}ms before starting recognition`);
        
        startTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
            debugLog("Recognition started with iOS-optimized delay");
            startTimeoutRef.current = null;
          } catch (error) {
            debugLog(`Error starting recognition: ${error}`);
            setError("Failed to start speech recognition. Please try again.");
            setIsListening(false);
            startTimeoutRef.current = null;
          }
        }, startDelay);
      } catch (error) {
        debugLog(`iOS start sequence error: ${error}`);
        setError("Failed to initialize speech recognition");
        setIsListening(false);
      }
    } else {
      // Standard start for other platforms
      try {
        setIsListening(true);
        
        // Small delay for stability even on non-iOS
        const startDelay = isPWA ? 200 : 50;
        
        startTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
            debugLog("Recognition started successfully");
            startTimeoutRef.current = null;
          } catch (error) {
            debugLog(`Error starting recognition: ${error}`);
            setError("Failed to start speech recognition. Please try again.");
            setIsListening(false);
            startTimeoutRef.current = null;
          }
        }, startDelay);
      } catch (error) {
        debugLog(`Start error: ${error}`);
        setError("Failed to start speech recognition");
        setIsListening(false);
      }
    }
  }, [recognition, resetTranscriptState, isIOS, isPWA]);
  
  // Enhanced stop listening function with iOS-specific cleanup
  const stopListening = useCallback(() => {
    debugLog(`Stopping speech recognition. Is iOS: ${isIOS}, Is PWA: ${isPWA}`);
    
    // Clear any pending start timeouts
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    
    setIsListening(false);
    
    if (recognition) {
      try {
        recognition.stop();
        debugLog("Recognition stopped successfully");
      } catch (error) {
        debugLog(`Error stopping recognition: ${error}`);
        // Non-critical error, don't set error state
      }
    }
    
    // For iOS, release the audio stream when stopping
    // This helps with permission context in some cases
    if (isIOS && !isPWA) {
      debugLog("iOS: Releasing audio stream on stop");
      releaseAudioStream();
    }
    
    // For iOS PWA, keep the stream alive for faster restarts
  }, [recognition, isIOS, isPWA]);
  
  // Export the enhanced API
  return {
    transcript,
    interimTranscript,
    browserSupportsSpeechRecognition,
    isListening,
    startListening,
    stopListening,
    resetTranscript: resetTranscriptState,
    error,
    isPWA: detectedIsPWA,
    isMobile
  };
};

export default useSpeechRecognition;
