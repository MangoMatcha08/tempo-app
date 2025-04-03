
import { useState, useRef, useCallback, useEffect } from 'react';
import { debounce, getPlatformAdjustedTimeout } from './utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("TranscriptState");

// IMPROVEMENT 4: Improved Voice Processing Workflow
export const useTranscriptState = (options: { isPWA: boolean; isIOS: boolean } = { isPWA: false, isIOS: false }) => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResultTimestamp, setLastResultTimestamp] = useState<number>(0);
  const isMobile = useIsMobile();
  const { isPWA, isIOS } = options;
  
  // Use refs to store the current full transcript and interim results
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a debounced update function with platform-specific timing
  const debouncedSetTranscript = useCallback(
    debounce((text: string) => {
      debugLog(`Setting transcript: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`);
      setTranscript(text);
    }, getPlatformAdjustedTimeout(50, { isPWA, isMobile, isIOS })),
    [isMobile, isPWA, isIOS]
  );

  // Enhanced method to process speech results with platform-specific optimizations
  const processSpeechResults = useCallback((event: any) => {
    // Update the last result timestamp for activity tracking
    setLastResultTimestamp(Date.now());
    setIsProcessing(true);
    
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
    
    // Update refs with clean values
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
      
      // Mobile-specific direct update for more immediate feedback
      if ((isMobile || isPWA) && finalTranscriptRef.current) {
        debugLog(`Direct setting transcript on mobile/PWA: "${finalTranscriptRef.current.substring(0, 20)}${finalTranscriptRef.current.length > 20 ? '...' : ''}"`);
        setTranscript(finalTranscriptRef.current);
      }
    }
    
    // Clear any existing processing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Set a timeout to clear processing state
    processingTimeoutRef.current = setTimeout(() => {
      setIsProcessing(false);
      processingTimeoutRef.current = null;
    }, getPlatformAdjustedTimeout(300, { isPWA, isMobile, isIOS }));
  }, [debouncedSetTranscript, isMobile, isPWA, isIOS]);

  // Reset state with proper cleanup
  const resetTranscriptState = useCallback(() => {
    debugLog('Resetting transcript state');
    setTranscript('');
    setInterimTranscript('');
    setIsProcessing(false);
    setLastResultTimestamp(0);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    
    // Clear any pending timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, []);
  
  // Activity timeout monitoring - for detecting when speech has stopped
  useEffect(() => {
    // Only set up monitoring when we have a transcript and are receiving results
    if (lastResultTimestamp > 0 && (transcript || interimTranscript)) {
      const inactivityTimeout = getPlatformAdjustedTimeout(3000, { isPWA, isMobile, isIOS });
      
      const checkActivityInterval = setInterval(() => {
        const timeSinceLastResult = Date.now() - lastResultTimestamp;
        
        // If no results for a while, assume speech has ended
        if (timeSinceLastResult > inactivityTimeout) {
          debugLog(`No speech detected for ${timeSinceLastResult}ms, finalizing transcript`);
          setIsProcessing(false);
          clearInterval(checkActivityInterval);
        }
      }, 1000);
      
      return () => clearInterval(checkActivityInterval);
    }
  }, [lastResultTimestamp, transcript, interimTranscript, isPWA, isMobile, isIOS]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    isProcessing,
    setTranscript,
    resetTranscriptState,
    processSpeechResults
  };
};
