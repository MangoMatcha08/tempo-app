
export { default as useSpeechRecognition } from './useSpeechRecognition';
export { default as useEnhancedSpeechRecognition } from './useEnhancedSpeechRecognition';
export { default as useTranscriptState } from './useTranscriptState';
export { detectEnvironment, getEnvironmentDescription } from './environmentDetection';
export * from './types';
export * from './errorHandlers';

// Provide both named exports and default exports for backward compatibility
import useSpeechRecognition from './useSpeechRecognition';
export default useSpeechRecognition;
