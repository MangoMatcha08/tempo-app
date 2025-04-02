
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
  const { recognition, browserSupportsSpeechRecognition } = useSpeechRecognitionSetup({
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
    
    recognition.onresult = (event: any) => {
      processSpeechResults(event);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't stop listening on "no-speech" errors, just log them
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
        return;
      }
      
      // For network errors, try to restart recognition
      if (event.error === 'network') {
        console.log('Network error, attempting to restart recognition...');
        setTimeout(() => {
          if (isListening) {
            try {
              recognition.start();
            } catch (err) {
              console.error('Failed to restart after network error:', err);
              setError(`Speech recognition network error. Please try again.`);
              setIsListening(false);
            }
          }
        }, 1000);
        return;
      }
      
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    // Cleanup
    return () => {
      if (recognition) {
        try {
          recognition.stop();
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
    if (!recognition) return;
    
    // Reset transcript
    resetTranscriptState();
    setError(undefined);
    
    setIsListening(true);
    try {
      recognition.start();
      console.log('Speech recognition started');
    } catch (err) {
      // Handle the case where recognition is already started
      console.error('Recognition already started:', err);
    }
  }, [recognition, resetTranscriptState]);

  /**
   * Stops the speech recognition process
   */
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
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
    error
  };
};

export default useSpeechRecognition;
