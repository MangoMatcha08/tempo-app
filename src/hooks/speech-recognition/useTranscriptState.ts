
import { useState, useCallback, useRef } from 'react';

/**
 * Enhanced transcript state management hook
 * Manages transcript state with platform-specific optimizations
 */
export const useTranscriptState = () => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const accumulatedTranscriptRef = useRef('');
  
  /**
   * Update the transcript with new content
   * @param newFinalTranscript Final transcript to append
   * @param newInterimTranscript Interim transcript to set
   */
  const updateTranscript = useCallback((newFinalTranscript: string, newInterimTranscript: string = '') => {
    if (newFinalTranscript) {
      setTranscript(prev => {
        const updated = prev ? `${prev} ${newFinalTranscript}`.trim() : newFinalTranscript.trim();
        return updated;
      });
    }
    
    setInterimTranscript(newInterimTranscript);
  }, []);
  
  /**
   * Reset all transcript state
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);
  
  /**
   * Add transcript to accumulated storage (useful for iOS PWA)
   * @param additionalTranscript Transcript to accumulate
   */
  const accumulateTranscript = useCallback((additionalTranscript: string) => {
    if (additionalTranscript) {
      accumulatedTranscriptRef.current += ' ' + additionalTranscript;
    }
  }, []);
  
  /**
   * Get the complete transcript including any accumulated content
   * @returns Complete transcript
   */
  const getCompleteTranscript = useCallback(() => {
    const accumulated = accumulatedTranscriptRef.current.trim();
    const current = transcript.trim();
    
    if (accumulated && current) {
      return `${accumulated} ${current}`;
    }
    
    return accumulated || current;
  }, [transcript]);
  
  return {
    transcript,
    interimTranscript,
    updateTranscript,
    resetTranscript,
    accumulateTranscript,
    getCompleteTranscript
  };
};

export default useTranscriptState;
