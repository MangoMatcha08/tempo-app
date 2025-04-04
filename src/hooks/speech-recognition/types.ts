
import { EnvironmentConfig } from './environmentDetection';

export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  browserSupportsSpeechRecognition: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error?: string;
  isPwa: boolean;
  environmentConfig: EnvironmentConfig;
}

export interface RecorderState {
  status: 'idle' | 'recording' | 'processing' | 'confirming' | 'error';
  transcript?: string;
  message?: string;
  result?: any;
}

export type RecorderActions = {
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
  updateTranscript: (transcript: string) => void;
  processingComplete: (result: any) => void;
  processingError: (message: string) => void;
};
