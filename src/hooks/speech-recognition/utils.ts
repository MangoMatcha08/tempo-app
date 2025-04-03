// Re-export existing utility functions
// (keeping any existing code from the file)

/**
 * Creates a speech recognition instance if supported by the browser
 * @returns SpeechRecognition instance or null
 */
export const createSpeechRecognition = (): any => {
  // @ts-ignore - SpeechRecognition is not in TypeScript's lib.dom
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    return new SpeechRecognition();
  }
  
  return null;
};

/**
 * Configure the speech recognition instance with appropriate settings
 * @param recognition SpeechRecognition instance
 * @param optimizeForMobile Whether to optimize for mobile/PWA
 */
export const configureSpeechRecognition = (recognition: any, optimizeForMobile: boolean = false): void => {
  if (!recognition) return;
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = 'en-US';
  
  // Mobile optimizations to reduce battery usage
  if (optimizeForMobile) {
    // Lower sampling rate for mobile
    if (recognition.audioConfig) {
      recognition.audioConfig.sampleRateHertz = 16000;
    }
  }
};

/**
 * Check if speech recognition is supported by the browser
 * @returns boolean indicating if speech recognition is supported
 */
export const isSpeechRecognitionSupported = (): boolean => {
  // @ts-ignore - SpeechRecognition is not in TypeScript's lib.dom
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

/**
 * Debounce function to limit the rate of function calls
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
};
