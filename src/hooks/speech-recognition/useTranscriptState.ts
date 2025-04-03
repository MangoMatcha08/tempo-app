
import { useState, useRef, useCallback } from 'react';
import { debounce } from './utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("TranscriptState");

export const useTranscriptState = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const isMobile = useIsMobile();
  
  // Use refs to store the current full transcript and interim results
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  
  // Create a debounced update function with mobile-specific timing
  const debouncedSetTranscript = useCallback(
    debounce((text: string) => {
      debugLog(`Setting transcript: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`);
      setTranscript(text);
    }, isMobile ? 30 : 50), // Even faster updates on mobile
    [isMobile]
  );

  const processSpeechResults = useCallback((event: any) => {
    // Process results to separate final from interim
    let finalTranscript = finalTranscriptRef.current;
    let interimTranscript = '';
    
    debugLog(`Processing speech results with ${event.results.length} results`);
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptResult = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        // Only add to final transcript if it's a final result
        finalTranscript += ' ' + transcriptResult;
        debugLog(`Added final result: "${transcriptResult}"`);
      } else {
        // Store interim results separately
        interimTranscript += transcriptResult;
        debugLog(`Added interim result: "${transcriptResult}"`);
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
      
      // On mobile, we need to ensure the transcript is set immediately
      // This helps with the issue where the transcript isn't being sent
      if (isMobile && finalTranscriptRef.current) {
        debugLog(`Direct setting transcript on mobile: "${finalTranscriptRef.current.substring(0, 20)}${finalTranscriptRef.current.length > 20 ? '...' : ''}"`);
        setTranscript(finalTranscriptRef.current);
      }
    }
  }, [debouncedSetTranscript, isMobile]);

  const resetTranscriptState = useCallback(() => {
    debugLog('Resetting transcript state');
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
