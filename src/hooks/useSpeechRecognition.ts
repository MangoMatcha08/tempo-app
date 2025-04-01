
import { useState, useEffect, useCallback, useRef } from 'react';

// Define the interface for the speech recognition hook
interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
  error?: string;
}

// Debounce function to prevent rapid updates
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Create a custom hook for speech recognition
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState<boolean>(false);
  
  // Use refs to store the current full transcript and interim results
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  
  // Create a debounced update function
  const debouncedSetTranscript = useCallback(
    debounce((text: string) => {
      setTranscript(text);
    }, 100), // Reduced debounce time for more responsiveness
    []
  );

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore - TypeScript doesn't recognize these browser-specific APIs
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;
      
      // Fix: Increase the maximum allowed speech segment to prevent early stopping
      // This property is non-standard but works in Chrome
      // @ts-ignore
      if (typeof recognitionInstance.maxSpeechSegmentDuration === 'number') {
        // @ts-ignore
        recognitionInstance.maxSpeechSegmentDuration = 120; // Set to 120 seconds (or higher if needed)
      }
      
      recognitionInstance.onresult = (event: any) => {
        // Process results to separate final from interim
        let finalTranscript = finalTranscriptRef.current;
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptResult = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            // Only add to final transcript if it's a final result
            finalTranscript += ' ' + transcriptResult;
          } else {
            // Store interim results separately
            interimTranscript += transcriptResult;
          }
        }
        
        // Update refs
        finalTranscriptRef.current = finalTranscript.trim();
        interimTranscriptRef.current = interimTranscript;
        
        // Always update state with the most complete transcript
        const fullTranscript = finalTranscriptRef.current
          ? finalTranscriptRef.current
          : interimTranscriptRef.current;
        
        if (fullTranscript) {
          debouncedSetTranscript(fullTranscript);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
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
                recognitionInstance.start();
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
      
      recognitionInstance.onend = () => {
        console.log('Speech recognition ended, isListening:', isListening);
        
        // If still supposed to be listening, restart recognition
        if (isListening) {
          console.log('Restarting speech recognition...');
          try {
            recognitionInstance.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
            setError('Failed to restart speech recognition. Please try again.');
            setIsListening(false);
          }
        } else {
          // If we've stopped listening intentionally, make sure 
          // the final transcript is reflected in the state
          if (finalTranscriptRef.current) {
            setTranscript(finalTranscriptRef.current);
          }
        }
      };
      
      setRecognition(recognitionInstance);
      setBrowserSupportsSpeechRecognition(true);
    } else {
      setError('Your browser does not support speech recognition.');
      setBrowserSupportsSpeechRecognition(false);
    }
    
    // Cleanup
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [debouncedSetTranscript, isListening]);

  // Start listening function
  const startListening = useCallback(() => {
    if (!recognition) return;
    
    // Reset transcripts
    setTranscript('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setError(undefined);
    
    setIsListening(true);
    try {
      recognition.start();
      console.log('Speech recognition started');
    } catch (err) {
      // Handle the case where recognition is already started
      console.error('Recognition already started:', err);
    }
  }, [recognition]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    console.log('Stopping speech recognition');
    setIsListening(false);
    recognition.stop();
    
    // Ensure we're showing the final transcript
    if (finalTranscriptRef.current) {
      setTranscript(finalTranscriptRef.current);
    }
  }, [recognition]);

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error
  };
};

export default useSpeechRecognition;
