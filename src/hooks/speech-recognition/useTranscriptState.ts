
import { useState, useRef, useCallback } from 'react';
import { debounce } from './utils';

export const useTranscriptState = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  
  // Use refs to store the current full transcript and interim results
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  
  // Create a debounced update function
  const debouncedSetTranscript = useCallback(
    debounce((text: string) => {
      setTranscript(text);
    }, 50), // Reduced debounce time for more responsiveness
    []
  );

  const processSpeechResults = useCallback((event: any) => {
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
    
    // Update state with interim transcript
    setInterimTranscript(interimTranscript);
    
    // Always update state with the most complete transcript
    const fullTranscript = finalTranscriptRef.current
      ? finalTranscriptRef.current
      : interimTranscriptRef.current;
    
    if (fullTranscript) {
      debouncedSetTranscript(fullTranscript);
    }
  }, [debouncedSetTranscript]);

  const resetTranscriptState = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
  }, []);

  return {
    transcript,
    interimTranscript,
    setTranscript,
    resetTranscriptState,
    processSpeechResults
  };
};
