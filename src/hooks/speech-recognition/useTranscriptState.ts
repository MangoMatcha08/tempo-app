
import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from './utils';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("TranscriptState");

// Enhanced transcript state management
export interface UseTranscriptStateProps {
  isPWA?: boolean;
  isIOS?: boolean;
}

export interface UseTranscriptStateReturn {
  transcript: string;
  interimTranscript: string;
  isProcessing: boolean;
  resetTranscriptState: () => void;
  processSpeechResults: (event: any) => void;
}

export const useTranscriptState = ({ isPWA = false, isIOS = false }: UseTranscriptStateProps): UseTranscriptStateReturn => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const finalResultsRef = useRef<string[]>([]);
  const lastResultTimestampRef = useRef(0);
  const resultCountRef = useRef(0);
  const lastProcessedEventRef = useRef<any>(null);
  
  // Cleanup function to reset all state
  const resetTranscriptState = useCallback(() => {
    debugLog("Resetting transcript state");
    setTranscript('');
    setInterimTranscript('');
    setIsProcessing(false);
    finalResultsRef.current = [];
    lastResultTimestampRef.current = 0;
    resultCountRef.current = 0;
    lastProcessedEventRef.current = null;
  }, []);
  
  // Debounced update for better UX
  const debouncedInterimUpdate = useCallback(
    debounce((text: string) => {
      if (text !== interimTranscript) {
        setInterimTranscript(text);
      }
    }, isPWA || isIOS ? 100 : 50),
    [interimTranscript, isPWA, isIOS]
  );
  
  // Process speech recognition results
  const processSpeechResults = useCallback((event: any) => {
    debugLog(`Processing speech results, isPWA: ${isPWA}, isIOS: ${isIOS}`);
    
    // Ensure we have results
    if (!event || !event.results) {
      debugLog("No results in event");
      return;
    }
    
    // Store the event for potential reprocessing
    lastProcessedEventRef.current = event;
    
    // Track result processing
    resultCountRef.current++;
    const resultCount = resultCountRef.current;
    
    // Update timing data
    const now = Date.now();
    const timeSinceLastResult = now - lastResultTimestampRef.current;
    lastResultTimestampRef.current = now;
    
    // Log processing metrics
    debugLog(`Result #${resultCount}, time since last: ${timeSinceLastResult}ms`);
    
    // More conservative throttling to ensure we catch results
    const shouldThrottle = isIOS && timeSinceLastResult < 200 && resultCount > 5;
    if (shouldThrottle) {
      debugLog("Throttling rapid results on iOS");
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const results = event.results;
      let finalTranscript = '';
      let interimResult = '';
      let hasMeaningfulContent = false;
      
      // Process results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        if (result.isFinal) {
          // Finalized result - add to our transcript
          const text = result[0].transcript.trim();
          if (text) {
            finalResultsRef.current.push(text);
            hasMeaningfulContent = true;
            debugLog(`Added final result: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
          }
        } else {
          // Interim result - more potential updates coming
          const interimText = result[0].transcript.trim();
          if (interimText) {
            interimResult += interimText + ' ';
            // Even interim results can indicate we have content
            if (interimText.length > 5) {
              hasMeaningfulContent = true;
            }
          }
        }
      }
      
      // Build final transcript from all collected final results
      finalTranscript = finalResultsRef.current.join(' ');
      
      // Update interim transcript via debounced function
      if (interimResult) {
        debouncedInterimUpdate(interimResult);
        debugLog(`Updated interim transcript: "${interimResult.substring(0, 30)}${interimResult.length > 30 ? '...' : ''}"`);
      }
      
      // Only update transcript if we have a meaningful change
      if (finalTranscript && finalTranscript !== transcript) {
        debugLog(`Updating transcript: "${finalTranscript.substring(0, 30)}${finalTranscript.length > 30 ? '...' : ''}"`);
        setTranscript(finalTranscript);
      }
      
      // Always mark as processing if we have any content at all
      // This helps bridge the gap between result processing
      if (hasMeaningfulContent) {
        debugLog("Setting isProcessing to true because meaningful content was detected");
        setIsProcessing(true);
      } else {
        // Set processing state based on interim result presence
        const shouldStillBeProcessing = interimResult.length > 0;
        setIsProcessing(shouldStillBeProcessing);
        debugLog(`Setting isProcessing to ${shouldStillBeProcessing} based on interim result`);
      }
      
    } catch (error) {
      console.error("Error processing speech results:", error);
      debugLog(`Error processing speech results: ${error}`);
      setIsProcessing(false);
    }
  }, [transcript, debouncedInterimUpdate, isPWA, isIOS]);
  
  // Cleanup on unmount
  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      // If we have a transcript, ensure isProcessing is true
      if (!isProcessing) {
        debugLog("Setting processing to true because we have transcript content");
        setIsProcessing(true);
      }
    }
  }, [transcript, isProcessing]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debugLog("Cleaning up transcript state");
      finalResultsRef.current = [];
    };
  }, []);
  
  return {
    transcript,
    interimTranscript,
    isProcessing,
    resetTranscriptState,
    processSpeechResults
  };
};
