// Speech recognition utility functions
// Browser compatibility helpers for Web Speech API

/**
 * Creates a speech recognition instance with browser compatibility
 * @returns Speech recognition instance or null if not supported
 */
export const createSpeechRecognition = (): any => {
  // Try to find the appropriate Speech Recognition constructor
  const SpeechRecognition = (window as any).SpeechRecognition || 
                           (window as any).webkitSpeechRecognition ||
                           (window as any).mozSpeechRecognition ||
                           (window as any).msSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('Speech recognition not supported in this browser');
    return null;
  }
  
  try {
    const recognition = new SpeechRecognition();
    return recognition;
  } catch (error) {
    console.error('Error creating speech recognition instance:', error);
    return null;
  }
};

/**
 * Checks if speech recognition is supported in the current browser
 * @returns boolean indicating if speech recognition is supported
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return !!(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition
  );
};

/**
 * Configure the speech recognition instance with appropriate settings
 * @param recognition Speech recognition instance
 * @param isMobile Whether the user is on a mobile device
 */
export const configureSpeechRecognition = (recognition: any, isMobile = false): void => {
  if (!recognition) return;

  // Set recognition properties
  recognition.continuous = true;      // Keep listening even if the user pauses
  recognition.interimResults = true;  // Get results while the user is still speaking
  recognition.maxAlternatives = 1;    // Only return the most likely match
  
  // Use shorter timeouts on mobile to save battery
  if (isMobile) {
    // Safari on iOS seems to have issues with long continuous sessions
    // so we set a shorter timeout and rely on restarting the session
    recognition.continuous = false;
  }
  
  // Try to set the language based on browser language
  try {
    const preferredLanguage = navigator.language || 'en-US';
    recognition.lang = preferredLanguage;
    console.log(`Speech recognition language set to: ${preferredLanguage}`);
  } catch (err) {
    console.warn('Failed to set speech recognition language, using default');
    recognition.lang = 'en-US';
  }
};

/**
 * Helper to create a mock SpeechRecognitionEvent for testing
 * @param transcript Text to include in the mock event
 * @returns Mock SpeechRecognitionEvent
 */
export const createMockSpeechEvent = (transcript: string): any => {
  return {
    resultIndex: 0,
    results: [
      [{ transcript, isFinal: true }]
    ]
  };
};

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    const later = () => {
      timeout = null;
      func.apply(context, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};
