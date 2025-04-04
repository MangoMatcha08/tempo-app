
/**
 * Speech recognition hook with platform-aware optimizations
 * Main entry point for speech recognition functionality
 */

import { useState, useEffect, useCallback } from 'react';
import useEnhancedSpeechRecognition from './useEnhancedSpeechRecognition';
import { UseSpeechRecognitionReturn } from './types';

/**
 * Speech recognition hook that provides a simple interface for recording voice
 * with platform-specific optimizations
 * 
 * @returns Speech recognition interface with transcript and controls
 */
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  // Use the enhanced speech recognition hook
  const {
    transcript,
    interimTranscript,
    isListening,
    isRecovering,
    browserSupportsSpeechRecognition,
    startListening: startListeningEnhanced,
    stopListening: stopListeningEnhanced,
    resetTranscript: resetTranscriptEnhanced,
    getCompleteTranscript,
    error,
    isPwa,
    environmentInfo
  } = useEnhancedSpeechRecognition();

  // Wrap the enhanced functions to maintain backward compatibility
  const startListening = useCallback(() => {
    startListeningEnhanced();
  }, [startListeningEnhanced]);

  const stopListening = useCallback(() => {
    stopListeningEnhanced();
  }, [stopListeningEnhanced]);

  const resetTranscript = useCallback(() => {
    resetTranscriptEnhanced();
  }, [resetTranscriptEnhanced]);

  // Return the same interface as before but with enhanced implementation
  return {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error,
    isPwa,
    environmentInfo
  };
};

export default useSpeechRecognition;
