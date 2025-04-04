
/**
 * Enhanced error handling for speech recognition with recovery strategies
 * This module provides platform-specific error handlers and recovery mechanisms
 */
import { detectEnvironment } from './environmentDetection';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high';

// Error response structure
export interface ErrorResponse {
  severity: ErrorSeverity;
  message: string;
  recoverable: boolean;
  retry?: () => void;
}

/**
 * Main error handler - routes to appropriate platform-specific handler
 * @param error The speech recognition error event
 * @param context Current state and utilities
 * @returns Structured error response
 */
export const handleRecognitionError = (
  error: SpeechRecognitionErrorEvent,
  context: {
    isListening: boolean,
    env: ReturnType<typeof detectEnvironment>,
    recognitionRef: React.RefObject<SpeechRecognition>,
    retryAttemptsRef: React.RefObject<number>,
    createTimeout: (callback: () => void, delay: number) => number,
    onError?: (message: string) => void,
    onRecoveryStart?: () => void,
    onRecoveryComplete?: () => void
  }
): ErrorResponse => {
  const { env, isListening } = context;
  
  // Log all errors for debugging
  console.error('Speech recognition error:', error.error, error);
  
  // Route to platform-specific handlers
  if (env.isIOSPwa) {
    return handleIOSPwaError(error, context);
  } else if (env.isPwa) {
    return handlePwaError(error, context);
  } else {
    return handleStandardError(error, context);
  }
};

/**
 * Handle errors specifically for iOS PWA environment
 */
const handleIOSPwaError = (
  error: SpeechRecognitionErrorEvent,
  {
    isListening,
    env,
    recognitionRef,
    retryAttemptsRef,
    createTimeout,
    onError,
    onRecoveryStart,
    onRecoveryComplete
  }
): ErrorResponse => {
  // Get current recognition instance
  const recognition = recognitionRef.current;
  if (!recognition) {
    if (onError) onError('Speech recognition not available');
    return {
      severity: 'high',
      message: 'Speech recognition not available',
      recoverable: false
    };
  }
  
  // Handle different error types
  switch (error.error) {
    case 'network':
    case 'aborted':
    case 'service-not-allowed':
      // These errors are common in iOS PWA and can be recovered
      if (retryAttemptsRef.current < 5) { // More retries for iOS
        retryAttemptsRef.current++;
        
        // Use a fixed but longer delay for iOS to let the browser recover
        const delay = 800;
        
        console.log(`iOS PWA error: ${error.error}, recovery attempt ${retryAttemptsRef.current}`);
        
        // Create retry function
        const retry = () => {
          try {
            // Alert that we're recovering
            if (onRecoveryStart) onRecoveryStart();
            
            // Complete reset of recognition
            recognition.abort(); // More forceful than stop
            
            // Wait longer before restart on iOS
            createTimeout(() => {
              try {
                if (isListening) {
                  recognition.start();
                  // Signal recovery complete
                  if (onRecoveryComplete) onRecoveryComplete();
                }
              } catch (innerErr) {
                console.error('iOS restart failed:', innerErr);
                if (onError) onError('Recognition failed to restart. Please try again.');
              }
            }, 500);
          } catch (err) {
            console.error('iOS recovery attempt failed:', err);
            if (onError) onError('Recognition error. Please try again.');
          }
        };
        
        // Auto-retry for iOS PWA
        createTimeout(retry, delay);
        
        return {
          severity: 'medium',
          message: 'Reconnecting...',
          recoverable: true,
          retry
        };
      }
      
      // Too many retries
      if (onError) onError('Voice recognition stopped working. Please try again.');
      return {
        severity: 'high',
        message: 'Voice recognition stopped working. Please try again.',
        recoverable: false
      };
      
    case 'not-allowed':
      if (onError) onError('Microphone access was denied. Please enable microphone access in your settings.');
      return {
        severity: 'high',
        message: 'Microphone access was denied. Please enable microphone access in your settings.',
        recoverable: false
      };
      
    case 'audio-capture':
      if (onError) onError('No microphone was found or it is being used by another application.');
      return {
        severity: 'high',
        message: 'No microphone was found or it is being used by another application.',
        recoverable: false
      };
      
    case 'no-speech':
      // This is common and not a real error to show users
      return {
        severity: 'low',
        message: 'No speech detected. Please speak more clearly.',
        recoverable: true
      };
      
    default:
      if (onError) onError(`Recognition error: ${error.error}`);
      return {
        severity: 'high',
        message: `Recognition error: ${error.error}`,
        recoverable: false
      };
  }
};

/**
 * Handle errors for standard PWA (non-iOS) environment
 */
const handlePwaError = (
  error: SpeechRecognitionErrorEvent,
  {
    isListening,
    env,
    recognitionRef,
    retryAttemptsRef,
    createTimeout,
    onError,
    onRecoveryStart,
    onRecoveryComplete
  }
): ErrorResponse => {
  // Get current recognition instance
  const recognition = recognitionRef.current;
  if (!recognition) {
    if (onError) onError('Speech recognition not available');
    return {
      severity: 'high',
      message: 'Speech recognition not available',
      recoverable: false
    };
  }
  
  // Handle different error types
  switch (error.error) {
    case 'network':
      // Implement exponential backoff for network errors
      if (retryAttemptsRef.current < env.recognitionConfig.maxRetries) {
        retryAttemptsRef.current++;
        const delay = env.recognitionConfig.baseRetryDelay * Math.pow(2, retryAttemptsRef.current);
        
        console.log(`Network error, retrying in ${delay}ms (attempt ${retryAttemptsRef.current})`);
        
        // Create retry function
        const retry = () => {
          if (onRecoveryStart) onRecoveryStart();
          
          createTimeout(() => {
            try {
              if (isListening) {
                recognition.start();
                if (onRecoveryComplete) onRecoveryComplete();
              }
            } catch (err) {
              console.error('Failed to restart after network error:', err);
              if (onError) onError('Network error. Please check your connection and try again.');
            }
          }, delay);
        };
        
        // Auto-retry
        createTimeout(retry, 0);
        
        return {
          severity: 'medium',
          message: 'Connection issue detected. Attempting to reconnect...',
          recoverable: true,
          retry
        };
      }
      
      // Too many retries
      if (onError) onError('Network issues prevented recording. Please try again later.');
      return {
        severity: 'high',
        message: 'Network issues prevented recording. Please try again later.',
        recoverable: false
      };
      
    case 'not-allowed':
      if (onError) onError('Microphone access was denied. Please enable microphone access in your settings.');
      return {
        severity: 'high',
        message: 'Microphone access was denied. Please enable microphone access in your settings.',
        recoverable: false
      };
      
    case 'audio-capture':
      if (onError) onError('No microphone was found or it is being used by another application.');
      return {
        severity: 'high',
        message: 'No microphone was found or it is being used by another application.',
        recoverable: false
      };
      
    case 'no-speech':
      // This is common and not a real error
      return {
        severity: 'low',
        message: 'No speech detected. Please speak more clearly.',
        recoverable: true
      };
      
    case 'aborted':
      // Only handle if unexpected
      if (isListening) {
        console.log('Unexpected abort, attempting to restart');
        
        const retry = () => {
          if (onRecoveryStart) onRecoveryStart();
          
          createTimeout(() => {
            try {
              recognition.start();
              if (onRecoveryComplete) onRecoveryComplete();
            } catch (err) {
              console.error('Failed to restart after abort:', err);
              if (onError) onError('Failed to restart. Please try again.');
            }
          }, 300);
        };
        
        // Auto-retry
        createTimeout(retry, 0);
        
        return {
          severity: 'medium',
          message: 'Recognition was interrupted. Reconnecting...',
          recoverable: true,
          retry
        };
      }
      
      return {
        severity: 'low',
        message: 'Recording stopped.',
        recoverable: true
      };
      
    default:
      if (onError) onError(`Recognition error: ${error.error}`);
      return {
        severity: 'high',
        message: `Recognition error: ${error.error}`,
        recoverable: false
      };
  }
};

/**
 * Handle errors for standard browser environment
 */
const handleStandardError = (
  error: SpeechRecognitionErrorEvent,
  {
    isListening,
    env,
    recognitionRef,
    retryAttemptsRef,
    createTimeout,
    onError,
    onRecoveryStart,
    onRecoveryComplete
  }
): ErrorResponse => {
  // Similar to handlePwaError but with browser-specific optimizations
  // Get current recognition instance
  const recognition = recognitionRef.current;
  if (!recognition) {
    if (onError) onError('Speech recognition not available');
    return {
      severity: 'high',
      message: 'Speech recognition not available',
      recoverable: false
    };
  }
  
  // Handle different error types - desktop browsers are generally more reliable
  switch (error.error) {
    case 'not-allowed':
      if (onError) onError('Microphone access was denied. Please enable microphone access in your browser settings.');
      return {
        severity: 'high',
        message: 'Microphone access was denied. Please enable microphone access in your browser settings.',
        recoverable: false
      };
      
    case 'audio-capture':
      if (onError) onError('No microphone was found or it is being used by another application.');
      return {
        severity: 'high',
        message: 'No microphone was found or it is being used by another application.',
        recoverable: false
      };
      
    case 'network':
      // Standard browsers generally recover better from network issues
      if (retryAttemptsRef.current < env.recognitionConfig.maxRetries) {
        retryAttemptsRef.current++;
        
        const retry = () => {
          if (onRecoveryStart) onRecoveryStart();
          
          createTimeout(() => {
            try {
              if (isListening) {
                recognition.start();
                if (onRecoveryComplete) onRecoveryComplete();
              }
            } catch (err) {
              console.error('Failed to restart:', err);
              if (onError) onError('Failed to restart recording.');
            }
          }, 300);
        };
        
        // Auto-retry immediately for standard browsers
        retry();
        
        return {
          severity: 'low',
          message: 'Connection issue. Reconnecting...',
          recoverable: true,
          retry
        };
      }
      
      if (onError) onError('Network issues prevented recording. Please try again.');
      return {
        severity: 'medium',
        message: 'Network issues prevented recording. Please try again.',
        recoverable: false
      };
      
    case 'no-speech':
      // Not an error to show to users
      return {
        severity: 'low',
        message: '',
        recoverable: true
      };
      
    default:
      if (onError) onError(`Recognition error: ${error.error}`);
      return {
        severity: 'medium',
        message: `Recognition error: ${error.error}`,
        recoverable: false
      };
  }
};
