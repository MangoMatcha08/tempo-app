
/**
 * Utility functions for speech recognition
 */

// Debounce function to prevent rapid updates
export const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Creates a browser-compatible SpeechRecognition instance
 * @returns SpeechRecognition instance or null if not supported
 */
export const createSpeechRecognition = (): any | null => {
  // Check if browser supports speech recognition
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    // @ts-ignore - TypeScript doesn't recognize these browser-specific APIs
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return new SpeechRecognition();
  }
  return null;
};

/**
 * Configures the speech recognition instance with default settings
 * @param recognition - The speech recognition instance to configure
 */
export const configureSpeechRecognition = (recognition: any): void => {
  if (!recognition) return;
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;
  
  // Fix: Increase the maximum allowed speech segment to prevent early stopping
  // This property is non-standard but works in Chrome
  // @ts-ignore
  if (typeof recognition.maxSpeechSegmentDuration === 'number') {
    // @ts-ignore
    recognition.maxSpeechSegmentDuration = 120; // Set to 120 seconds (or higher if needed)
  }
};

/**
 * Checks if speech recognition is supported in the current browser
 * @returns boolean indicating if speech recognition is supported
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};
