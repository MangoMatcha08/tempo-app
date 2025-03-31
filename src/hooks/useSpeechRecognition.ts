
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
    }, 300),
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
        finalTranscriptRef.current = finalTranscript;
        interimTranscriptRef.current = interimTranscript;
        
        // Update state with debouncing
        // Only show interim results if there's no final transcript yet
        if (finalTranscript.trim()) {
          debouncedSetTranscript(finalTranscript.trim());
        } else if (interimTranscript.trim()) {
          debouncedSetTranscript(interimTranscript.trim());
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start();
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
  }, [debouncedSetTranscript]);

  // Start listening function
  const startListening = useCallback(() => {
    if (!recognition) return;
    
    // Reset transcripts
    setTranscript('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    
    setIsListening(true);
    try {
      recognition.start();
    } catch (err) {
      // Handle the case where recognition is already started
      console.error('Recognition already started:', err);
    }
  }, [recognition]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    setIsListening(false);
    recognition.stop();
    
    // Ensure we're showing the final transcript
    if (finalTranscriptRef.current.trim()) {
      setTranscript(finalTranscriptRef.current.trim());
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
