
export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
  error?: string;
  isPWA: boolean;
  isMobile: boolean;
}

export interface SpeechRecognitionConfig {
  onError?: (error: string) => void;
  isListening?: boolean;
  setIsListening?: (listening: boolean) => void;
}
