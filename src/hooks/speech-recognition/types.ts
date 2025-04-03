
// Speech recognition hook return type
export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  browserSupportsSpeechRecognition: boolean;
  isListening: boolean;
  isProcessing: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | undefined;
  isPWA: boolean;
  isMobile: boolean;
}

// Speech recognition options
export interface SpeechRecognitionOptions {
  isPWA?: boolean;
  isMobile?: boolean;
  isIOS?: boolean;
  isHighLatency?: boolean;
}
