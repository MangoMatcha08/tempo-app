
// Speech recognition utility functions
// Browser compatibility helpers for Web Speech API
import { detectEnvironment } from './environmentDetection';
import { RecognitionEnvironment } from './types';

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
 * Configure the speech recognition instance with environment-optimized settings
 * @param recognition Speech recognition instance
 */
export const configureSpeechRecognition = (recognition: any): void => {
  if (!recognition) return;

  // Get environment-specific configuration
  const env = detectEnvironment();
  const config = env.recognitionConfig;
  
  // Apply configuration
  recognition.continuous = config.continuous;
  recognition.interimResults = config.interimResults;
  recognition.maxAlternatives = config.maxAlternatives;
  
  // Log configuration for debugging
  console.log('Speech recognition configured for:', 
              env.isIOSPwa ? 'iOS PWA' : 
              (env.isPwa ? 'PWA' : 
              (env.isMobile ? 'Mobile browser' : 'Desktop browser')));
  
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
  const env = detectEnvironment();
  return env.isPwa;
};

/**
 * Gets the full environment information for the current platform
 * @returns RecognitionEnvironment object with detailed environment information
 */
export const getSpeechRecognitionEnvironment = (): RecognitionEnvironment => {
  return detectEnvironment();
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
