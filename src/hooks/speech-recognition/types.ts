
/**
 * Return type for useSpeechRecognition hook
 */
export interface UseSpeechRecognitionReturn {
  /** The final transcript text */
  transcript: string;
  
  /** The interim (real-time) transcript text that might change */
  interimTranscript?: string;
  
  /** Whether speech recognition is currently active */
  isListening: boolean;
  
  /** Starts the speech recognition process */
  startListening: () => void;
  
  /** Stops the speech recognition process */
  stopListening: () => void;
  
  /** Resets the current transcript to empty */
  resetTranscript: () => void;
  
  /** Whether the browser supports speech recognition */
  browserSupportsSpeechRecognition: boolean;
  
  /** Error message if something goes wrong */
  error?: string;
  
  /** Whether the app is running in PWA mode */
  isPWA: boolean;
  
  /** Whether the app is running on a mobile device */
  isMobile: boolean;
}
