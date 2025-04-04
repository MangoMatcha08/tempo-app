
// Speech recognition utility functions
// Browser compatibility helpers for Web Speech API

/**
 * Creates a speech recognition instance with enhanced browser compatibility
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
 * Checks if speech recognition is supported in the current browser with enhanced testing
 * @returns boolean indicating if speech recognition is supported
 */
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const SpeechRecognition = (window as any).SpeechRecognition || 
                           (window as any).webkitSpeechRecognition ||
                           (window as any).mozSpeechRecognition ||
                           (window as any).msSpeechRecognition;
  
  if (!SpeechRecognition) return false;
  
  try {
    // Test if we can actually create an instance
    new SpeechRecognition();
    return true;
  } catch (e) {
    console.error('Speech recognition not fully supported:', e);
    return false;
  }
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
  
  // Use shorter timeouts on mobile to save battery and handle PWA constraints
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
 * Implements retry logic with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in ms before exponential increase
 * @returns Promise that resolves when operation succeeds or max retries reached
 */
export const retryWithBackoff = async (
  operation: () => void,
  maxRetries: number = 3,
  baseDelay: number = 300
): Promise<void> => {
  let retries = 0;
  
  const attempt = async (): Promise<void> => {
    try {
      operation();
      return;
    } catch (error) {
      if (retries >= maxRetries) {
        console.error(`Failed after ${maxRetries} retries:`, error);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, retries);
      console.log(`Retry attempt ${retries + 1} after ${delay}ms`);
      retries++;
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(attempt());
        }, delay);
      });
    }
  };
  
  return attempt();
};

/**
 * Helper to check if currently running in PWA mode
 * @returns boolean indicating if the app is running as a PWA
 */
export const isRunningAsPwa = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
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
