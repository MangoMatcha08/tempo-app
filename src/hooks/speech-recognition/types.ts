
export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
  error?: string;
  isPwa?: boolean;
  environmentInfo?: {
    isIOS: boolean;
    isIOSPwa: boolean;
    isMobile: boolean;
    isPwa: boolean; // Added this property
    platform: string;
    browser: string;
  };
}

export interface RecognitionEnvironment {
  isPwa: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isMobile: boolean;
  isIOSPwa: boolean;
  userAgent: string;
  features: {
    hasSpeechRecognition: boolean;
    supportsInterimResults: boolean;
    supportsContinuous: boolean;
    requiresPolling: boolean;
    needsManualRestart: boolean;
  };
  recognitionConfig: {
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    restartDelay: number;
    maxSessionDuration: number;
    maxRetries: number;
    baseRetryDelay: number;
    enableManualRestart: boolean;
  };
}
