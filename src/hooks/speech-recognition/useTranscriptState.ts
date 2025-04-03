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
  setTranscript: (text: string) => void; // Added this missing property
}

export const useTranscriptState = ({ isPWA = false, isIOS = false }: UseTranscriptStateProps): UseTranscriptStateReturn => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const finalResultsRef = useRef<string[]>([]);
  const lastResultTimestampRef = useRef(0);
  const resultCountRef = useRef(0);
  const lastProcessedEventRef = useRef<any>(null);
  const processingAttemptsRef = useRef(0);
  const receivedContentRef = useRef(false);
  
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
    processingAttemptsRef.current = 0;
    receivedContentRef.current = false;
  }, []);
  
  // Debounced update for better UX
  const debouncedInterimUpdate = useCallback(
    debounce((text: string) => {
      if (text !== interimTranscript) {
        setInterimTranscript(text);
        debugLog(`Updated interim transcript: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      }
    }, isPWA || isIOS ? 100 : 50),
    [interimTranscript, isPWA, isIOS]
  );
  
  // Process speech recognition results with improved extraction logic
  const processSpeechResults = useCallback((event: any) => {
    debugLog(`Processing speech results, isPWA: ${isPWA}, isIOS: ${isIOS}`);
    
    // Ensure we have results
    if (!event || !event.results) {
      debugLog("No results in event");
      setIsProcessing(true);
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
      // Always set to processing when handling results
      setIsProcessing(true);
      
      const results = event.results;
      let finalTranscript = '';
      let interimResult = '';
      let hasMeaningfulContent = false;
      
      // Track if we found any content at all in the results
      let hasAnyContent = false;
      
      // Process results with detailed logging
      debugLog(`Processing ${results.length} result groups`);
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        if (result.isFinal) {
          // Finalized result - add to our transcript
          const text = result[0].transcript.trim();
          if (text) {
            debugLog(`Final result [${i}]: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" (confidence: ${result[0].confidence})`);
            finalResultsRef.current.push(text);
            hasMeaningfulContent = true;
            hasAnyContent = true;
            receivedContentRef.current = true;
          }
        } else {
          // Interim result - more potential updates coming
          const interimText = result[0].transcript.trim();
          if (interimText) {
            debugLog(`Interim result [${i}]: "${interimText.substring(0, 30)}${interimText.length > 30 ? '...' : ''}" (confidence: ${result[0].confidence})`);
            interimResult += interimText + ' ';
            hasAnyContent = true;
            // Even interim results can indicate we have content
            if (interimText.length > 2) {
              hasMeaningfulContent = true;
              receivedContentRef.current = true;
            }
          }
        }
      }
      
      // Build final transcript from all collected final results
      finalTranscript = finalResultsRef.current.join(' ');
      
      // Update interim transcript via debounced function
      if (interimResult) {
        debouncedInterimUpdate(interimResult);
      }
      
      // Only update transcript if we have a meaningful change
      if (finalTranscript && finalTranscript !== transcript) {
        debugLog(`Updating transcript: "${finalTranscript.substring(0, 30)}${finalTranscript.length > 30 ? '...' : ''}"`);
        setTranscript(finalTranscript);
      }
      
      // Important: if we have any content at all, mark as processing
      // This helps bridge the gap between result processing
      if (hasAnyContent) {
        debugLog("Setting isProcessing to true because content was detected");
        setIsProcessing(true);
        processingAttemptsRef.current = 0; // Reset attempts counter when we get content
      } else {
        processingAttemptsRef.current++;
        debugLog(`No content detected, attempt ${processingAttemptsRef.current}`);
        
        // Only set not processing after multiple consecutive attempts with no content
        // This prevents flickering and premature termination
        if (processingAttemptsRef.current > 3 && !interimResult && !finalTranscript) {
          debugLog(`Multiple attempts with no content, setting processing to ${!!interimResult}`);
          setIsProcessing(!!interimResult);
        } else {
          // Keep processing flag on during initial attempts
          setIsProcessing(true);
        }
      }
      
    } catch (error) {
      console.error("Error processing speech results:", error);
      debugLog(`Error processing speech results: ${error}`);
      setIsProcessing(true);
    }
  }, [transcript, debouncedInterimUpdate, isPWA, isIOS]);
  
  // Add stability monitoring
  useEffect(() => {
    const stabilityCheck = setInterval(() => {
      if (isProcessing && transcript === '') {
        // If we're processing but have no transcript after a while,
        // we may need to reset the processing state
        const hasReceivedContent = receivedContentRef.current;
        debugLog(`Stability check: processing with no transcript, received content ever: ${hasReceivedContent}`);
        processingAttemptsRef.current++;
        
        // After multiple checks with no transcript, reset the processing state
        // But only if we've never received content
        if (processingAttemptsRef.current > 5 && !hasReceivedContent) {
          debugLog("Resetting processing state due to stability check - no content ever received");
          setIsProcessing(false);
        } else if (processingAttemptsRef.current > 10) {
          // Even if we received content earlier, eventually reset
          debugLog("Resetting processing state due to stability check - timeout exceeded");
          setIsProcessing(false);
        }
      } else if (transcript && transcript.trim().length > 0) {
        // If we have a transcript, ensure processing is true and mark as having received content
        if (!isProcessing) {
          debugLog("Setting processing to true because we have transcript content");
          setIsProcessing(true);
        }
        receivedContentRef.current = true;
        // Reset the attempts counter when we have content
        processingAttemptsRef.current = 0;
      }
    }, 2000);
    
    return () => clearInterval(stabilityCheck);
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
    processSpeechResults,
    setTranscript
  };
};
