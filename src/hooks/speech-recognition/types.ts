
export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  browserSupportsSpeechRecognition: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error?: string;
  // Add platform detection properties
  isPWA: boolean;
  isMobile: boolean;
}
