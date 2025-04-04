
/// <reference types="vite/client" />

// Extend the Window interface to include firebase
interface Window {
  firebase: any;
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
  mozSpeechRecognition?: new () => SpeechRecognition;
  msSpeechRecognition?: new () => SpeechRecognition;
}

