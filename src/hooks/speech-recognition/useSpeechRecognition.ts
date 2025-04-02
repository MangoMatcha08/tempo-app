
import { useState, useEffect, useCallback } from 'react';
import { UseSpeechRecognitionReturn } from './types';
import { useSpeechRecognitionSetup } from './useSpeechRecognitionSetup';
import { useTranscriptState } from './useTranscriptState';

/**
 * Custom hook for speech recognition functionality
 * @returns Object containing transcript and speech recognition control methods
 */
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [error, setError] = useState<string | undefined>(undefined);
  const [isListening, setIsListening] = useState<boolean>(false);
  
  // Use separate hooks for managing recognition and transcript
  const { recognition, browserSupportsSpeechRecognition, isPWA } = useSpeechRecognitionSetup({
    onError: setError,
    isListening,
    setIsListening
  });
  
  const { 
    transcript, 
    interimTranscript,
    setTranscript, 
    resetTranscriptState, 
    processSpeechResults 
  } = useTranscriptState();
  
  // Configure recognition event handlers
  useEffect(() => {
    if (!recognition) return;
    
    console.log("Setting up recognition event handlers");
    
    recognition.onresult = (event: any) => {
      console.log("Recognition result received");
      processSpeechResults(event);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Map error types to user-friendly messages
      const errorMessages = {
        'not-allowed': 'Microphone access was denied. Please enable microphone access in your browser settings.',
        'audio-capture': 'No microphone was found or microphone is already in use.',
        'network': 'Network error occurred. Please check your internet connection.',
        'aborted': 'Speech recognition was aborted.',
        'no-speech': 'No speech was detected. Please try speaking louder or check your microphone.',
        'service-not-allowed': 'Speech recognition service not allowed. Try reloading the page.',
      };
      
      // Don't stop listening on "no-speech" errors, just log them
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
        return;
      }
      
      // Handle permission errors specially
      if (event.error === 'not-allowed') {
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        setIsListening(false);
        return;
      }
      
      // For network errors, try to restart recognition
      if (event.error === 'network') {
        console.log('Network error, attempting to restart recognition...');
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        
        setTimeout(() => {
          if (isListening) {
            try {
              recognition.start();
              console.log("Recognition restarted after network error");
            } catch (err) {
              console.error('Failed to restart after network error:', err);
              setError(`Speech recognition network error. Please try again.`);
              setIsListening(false);
            }
          }
        }, 1000);
        return;
      }
      
      // Set user-friendly error message
      setError(errorMessages[event.error as keyof typeof errorMessages] || `Speech recognition error: ${event.error}`);
      
      // Stop listening for critical errors
      if (['not-allowed', 'audio-capture', 'service-not-allowed'].includes(event.error)) {
        setIsListening(false);
      }
    };
    
    // Cleanup
    return () => {
      if (recognition) {
        try {
          recognition.stop();
          console.log("Recognition stopped during cleanup");
        } catch (err) {
          console.error('Error stopping recognition during cleanup:', err);
        }
      }
    };
  }, [recognition, isListening, processSpeechResults]);

  /**
   * Starts the speech recognition process
   */
  const startListening = useCallback(() => {
    if (!recognition) {
      console.error("Cannot start listening: recognition not initialized");
      return;
    }
    
    // Reset transcript
    resetTranscriptState();
    setError(undefined);
    
    setIsListening(true);
    try {
      recognition.start();
      console.log('Speech recognition started');
    } catch (err) {
      // Handle the case where recognition is already started
      console.error('Recognition error on start:', err);
      
      // Try to stop and restart if already started
      try {
        recognition.stop();
        console.log("Recognition stopped after error, will attempt restart");
        
        // Use a longer timeout in PWA mode
        setTimeout(() => {
          try {
            recognition.start();
            console.log("Recognition successfully restarted");
          } catch (startErr) {
            console.error("Second start attempt failed:", startErr);
            setError('Failed to start speech recognition. Please try reloading the page.');
            setIsListening(false);
          }
        }, isPWA ? 500 : 100);
      } catch (stopErr) {
        console.error('Failed to restart recognition:', stopErr);
        setError('Failed to start speech recognition. Please try reloading the page.');
        setIsListening(false);
      }
    }
  }, [recognition, resetTranscriptState, isPWA]);

  /**
   * Stops the speech recognition process
   */
  const stopListening = useCallback(() => {
    if (!recognition) {
      console.error("Cannot stop listening: recognition not initialized");
      return;
    }
    
    console.log('Stopping speech recognition');
    setIsListening(false);
    try {
      recognition.stop();
      console.log('Speech recognition stopped');
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }, [recognition]);

  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript: resetTranscriptState,
    browserSupportsSpeechRecognition,
    error,
    isPWA
  };
};

export default useSpeechRecognition;
