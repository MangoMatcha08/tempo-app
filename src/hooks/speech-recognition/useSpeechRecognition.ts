
import { useState, useRef, useEffect, useCallback } from 'react';
import { isPwaMode, isIOSDevice, isMobileDevice } from './utils';
import { useTranscriptState } from './useTranscriptState';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { createDebugLogger } from '@/utils/debugUtils';
import { UseSpeechRecognitionReturn } from './types';

const debugLog = createDebugLogger("useSpeechRecognition");

// Main hook for speech recognition
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  // Environment detection
  const isPWA = isPwaMode();
  const isIOS = isIOSDevice();
  const isMobile = isMobileDevice();
  
  debugLog(`Environment: isPWA=${isPWA}, isIOS=${isIOS}, isMobile=${isMobile}`);
  
  // State for speech recognition
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  
  // Transcript state management
  const {
    transcript,
    interimTranscript,
    resetTranscriptState,
    processSpeechResults,
    setTranscript
  } = useTranscriptState({ isPWA, isIOS });
  
  // Speech recognition setup
  const {
    recognition,
    browserSupportsSpeechRecognition
  } = useSpeechRecognitionSetup({
    onError: setError,
    isListening,
    setIsListening
  });
  
  // State tracking refs
  const isRecognitionActiveRef = useRef<boolean>(false);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset transcript
  const resetTranscript = useCallback(() => {
    resetTranscriptState();
    debugLog("Transcript reset");
  }, [resetTranscriptState]);

  // Configure recognition result handler
  useEffect(() => {
    if (!recognition) return;
    
    // Handle speech recognition results
    recognition.onresult = (event: any) => {
      debugLog(`Speech result event with ${event.results.length} results`);
      processSpeechResults(event);
    };
    
    return () => {
      if (recognition) {
        recognition.onresult = null;
      }
    };
  }, [recognition, processSpeechResults]);

  // Start listening function with enhanced error handling
  const startListening = useCallback(async () => {
    if (!recognition) {
      setError("Speech recognition is not supported in this browser");
      return;
    }
    
    if (isListening) {
      debugLog("Already listening, ignoring start request");
      return;
    }
    
    debugLog("Starting speech recognition");
    setError(undefined);
    resetTranscriptState();
    
    try {
      // Try to get microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // For iOS PWA, we keep the stream alive during recording
      if (isPWA && isIOS) {
        (window as any).microphoneStream = stream;
        debugLog("iOS PWA: storing microphone stream");
      } else {
        // For other platforms, we can release it right away
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
        }, 500);
      }
      
      // Start recognition
      isRecognitionActiveRef.current = true;
      recognition.start();
      setIsListening(true);
      debugLog("Recognition started successfully");
    } catch (err) {
      debugLog(`Error starting recognition: ${err}`);
      
      // Special handling for "already started" error
      if (err instanceof Error && err.message.includes('already started')) {
        debugLog("Recognition was already started");
        isRecognitionActiveRef.current = true;
        setIsListening(true);
      } else {
        setError(`Could not start speech recognition: ${err}`);
        isRecognitionActiveRef.current = false;
        setIsListening(false);
      }
    }
  }, [recognition, isListening, resetTranscriptState, isPWA, isIOS]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    debugLog("Stopping recognition");
    isRecognitionActiveRef.current = false;
    
    try {
      recognition.stop();
      debugLog("Recognition stopped successfully");
    } catch (err) {
      debugLog(`Error stopping recognition: ${err}`);
    }
    
    // Release iOS PWA microphone stream if it exists
    if (isPWA && isIOS && (window as any).microphoneStream) {
      setTimeout(() => {
        if ((window as any).microphoneStream) {
          (window as any).microphoneStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          (window as any).microphoneStream = null;
          debugLog("iOS PWA: released microphone stream");
        }
      }, 1000); // Give a second to process any final results
    }
    
    setIsListening(false);
  }, [recognition, isPWA, isIOS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognition && isListening) {
        try {
          recognition.stop();
          debugLog("Recognition stopped during cleanup");
        } catch (e) {
          debugLog(`Error stopping recognition during cleanup: ${e}`);
        }
      }
      
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
      
      // Release iOS PWA microphone stream if it exists
      if ((window as any).microphoneStream) {
        (window as any).microphoneStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        (window as any).microphoneStream = null;
        debugLog("Released microphone stream during cleanup");
      }
    };
  }, [recognition, isListening]);

  return {
    transcript,
    interimTranscript,
    isListening,
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
