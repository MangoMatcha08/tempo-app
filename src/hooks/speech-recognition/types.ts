
export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript?: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
  error?: string;
}

export interface UseSpeechRecognitionSetupProps {
  onError: (error: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}
