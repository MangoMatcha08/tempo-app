
import { useState, useRef, useCallback } from 'react';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("TranscriptState");

interface UseTranscriptStateProps {
  isPWA: boolean;
  isIOS: boolean;
}

export const useTranscriptState = ({ isPWA, isIOS }: UseTranscriptStateProps) => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  
  // Refs to track transcript state between renders
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  
  // Reset transcript state
  const resetTranscriptState = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    debugLog("Transcript state reset");
  }, []);
  
  // Process speech recognition results
  const processSpeechResults = useCallback((event: any) => {
    let finalTranscript = finalTranscriptRef.current;
    let interimTranscript = '';
    
    // Process results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptResult = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        // Add to final transcript if result is final
        finalTranscript += ' ' + transcriptResult;
        debugLog(`Final result: "${transcriptResult}"`);
      } else {
        // Accumulate interim results
        interimTranscript += transcriptResult;
        debugLog(`Interim result: "${transcriptResult}"`);
      }
    }
    
    // Clean up and update refs
    finalTranscriptRef.current = finalTranscript.trim();
    interimTranscriptRef.current = interimTranscript.trim();
    
    // Special handling for iOS PWA mode
    if (isPWA && isIOS) {
      // Update state immediately to improve responsiveness
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
      if (interimTranscript) {
        setInterimTranscript(interimTranscript);
      }
    } else {
      // For other platforms, only update state if there's a change
      if (finalTranscript !== transcript && finalTranscript) {
        setTranscript(finalTranscript);
      }
      
      if (interimTranscript !== interimTranscript && interimTranscript) {
        setInterimTranscript(interimTranscript);
      }
    }
  }, [transcript, interimTranscript, isPWA, isIOS]);
  
  return {
    transcript,
    interimTranscript,
    setTranscript,
    setInterimTranscript,
    finalTranscriptRef,
    interimTranscriptRef,
    resetTranscriptState,
    processSpeechResults
  };
};
