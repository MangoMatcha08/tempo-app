
import { useState, useCallback } from 'react';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("TranscriptState");

interface UseTranscriptStateProps {
  isPWA?: boolean;
  isIOS?: boolean;
}

export interface UseTranscriptStateReturn {
  transcript: string;
  interimTranscript: string;
  resetTranscriptState: () => void;
  processSpeechResults: (event: any) => void;
  setTranscript: (text: string) => void; // Added this to fix the error
}

export const useTranscriptState = ({ isPWA, isIOS }: UseTranscriptStateProps): UseTranscriptStateReturn => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  // Reset all transcript states
  const resetTranscriptState = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    debugLog("Transcript state reset");
  }, []);

  // Process speech recognition results
  const processSpeechResults = useCallback((event: any) => {
    let interimText = '';
    let finalText = '';

    // Iterate through results and categorize as interim or final
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      
      if (result.isFinal) {
        finalText += result[0].transcript;
        debugLog(`Final result [${i}]: "${result[0].transcript}"`);
      } else {
        interimText += result[0].transcript;
        debugLog(`Interim result [${i}]: "${result[0].transcript}"`);
      }
    }

    // Update interim transcript if needed
    if (interimText !== interimTranscript) {
      setInterimTranscript(interimText);
    }

    // If we have final text, append it to the transcript
    if (finalText) {
      setTranscript(prev => {
        const newTranscript = prev + ' ' + finalText.trim();
        const trimmedTranscript = newTranscript.trim();
        debugLog(`Updated transcript: "${trimmedTranscript.substring(0, 30)}${trimmedTranscript.length > 30 ? '...' : ''}"`);
        return trimmedTranscript;
      });
      
      // Apple devices sometimes don't clear interim transcript automatically
      if (isIOS) {
        setInterimTranscript('');
      }
    }
  }, [interimTranscript, isIOS]);

  return {
    transcript,
    interimTranscript,
    resetTranscriptState,
    processSpeechResults,
    setTranscript
  };
};

