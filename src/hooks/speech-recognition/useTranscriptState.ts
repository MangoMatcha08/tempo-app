import { useState, useCallback, useRef } from 'react';
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
  setTranscript: (text: string) => void;
}

export const useTranscriptState = ({ isPWA, isIOS }: UseTranscriptStateProps): UseTranscriptStateReturn => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const lastProcessedResultRef = useRef<string>('');
  const duplicateCountRef = useRef<number>(0);

  // Reset all transcript states
  const resetTranscriptState = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    lastProcessedResultRef.current = '';
    duplicateCountRef.current = 0;
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
        // Check for repeated words (common issue in iOS)
        const currentText = result[0].transcript.trim();
        
        // Skip if this is a duplicate of the last processed result
        if (currentText === lastProcessedResultRef.current) {
          duplicateCountRef.current++;
          debugLog(`Skipping duplicate result #${duplicateCountRef.current}: "${currentText}"`);
          continue;
        }
        
        // Store this result to check for duplicates
        lastProcessedResultRef.current = currentText;
        duplicateCountRef.current = 0;
        
        finalText += currentText;
        debugLog(`Final result [${i}]: "${currentText}"`);
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
        // Add a space only if we already have content
        const separator = prev.length > 0 ? ' ' : '';
        const newTranscript = prev + separator + finalText.trim();
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
