
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

// Context for error handling
export interface ErrorHandlerContext {
  isListening: boolean;
  env: ReturnType<typeof detectEnvironment>;
  recognitionRef: React.RefObject<SpeechRecognition>;
  retryAttemptsRef: React.RefObject<number>;
  createTimeout: (callback: () => void, delay: number) => number;
  onError?: (message: string) => void;
  onRecoveryStart?: () => void;
  onRecoveryComplete?: () => void;
}

/**
 * Main error handler - routes to appropriate platform-specific handler
 * @param error The speech recognition error event
 * @param context Current state and utilities
 * @returns Structured error response
 */
export const handleRecognitionError = (
  error: SpeechRecognitionErrorEvent,
  context: ErrorHandlerContext
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
  context: ErrorHandlerContext
): ErrorResponse => {
  // Get current recognition instance
  const recognition = context.recognitionRef.current;
  if (!recognition) {
    if (context.onError) context.onError('Speech recognition not available');
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
      if ((context.retryAttemptsRef.current || 0) < 5) { // More retries for iOS
        // Instead of directly assigning to .current (which is read-only in React.RefObject),
        // we'll utilize the onError callback to communicate the attempt count
        if (context.onError) context.onError(`Recovery attempt ${(context.retryAttemptsRef.current || 0) + 1}`);
        
        // Use a fixed but longer delay for iOS to let the browser recover
        const delay = 800;
        
        console.log(`iOS PWA error: ${error.error}, recovery attempt ${(context.retryAttemptsRef.current || 0) + 1}`);
        
        // Create retry function
        const retry = () => {
          try {
            // Alert that we're recovering
            if (context.onRecoveryStart) context.onRecoveryStart();
            
            // Complete reset of recognition
            recognition.abort(); // More forceful than stop
            
            // Wait longer before restart on iOS
            context.createTimeout(() => {
              try {
                if (context.isListening) {
                  recognition.start();
                  // Signal recovery complete
                  if (context.onRecoveryComplete) context.onRecoveryComplete();
                }
              } catch (innerErr) {
                console.error('iOS restart failed:', innerErr);
                if (context.onError) context.onError('Recognition failed to restart. Please try again.');
              }
            }, 500);
          } catch (err) {
            console.error('iOS recovery attempt failed:', err);
            if (context.onError) context.onError('Recognition error. Please try again.');
          }
        };
        
        // Auto-retry for iOS PWA
        context.createTimeout(retry, delay);
        
        return {
          severity: 'medium',
          message: 'Reconnecting...',
          recoverable: true,
          retry
        };
      }
      
      // Too many retries
      if (context.onError) context.onError('Voice recognition stopped working. Please try again.');
      return {
        severity: 'high',
        message: 'Voice recognition stopped working. Please try again.',
        recoverable: false
      };
      
    case 'not-allowed':
      if (context.onError) context.onError('Microphone access was denied. Please enable microphone access in your settings.');
      return {
        severity: 'high',
        message: 'Microphone access was denied. Please enable microphone access in your settings.',
        recoverable: false
      };
      
    case 'audio-capture':
      if (context.onError) context.onError('No microphone was found or it is being used by another application.');
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
      if (context.onError) context.onError(`Recognition error: ${error.error}`);
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
  context: ErrorHandlerContext
): ErrorResponse => {
  // Get current recognition instance
  const recognition = context.recognitionRef.current;
  if (!recognition) {
    if (context.onError) context.onError('Speech recognition not available');
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
      if ((context.retryAttemptsRef.current || 0) < 3) { // Using 3 as max retries
        // Instead of directly modifying .current
        const currentAttempts = (context.retryAttemptsRef.current || 0);
        const nextAttempt = currentAttempts + 1;
        const baseRetryDelay = 300; // Base delay in ms
        const delay = baseRetryDelay * Math.pow(2, nextAttempt);
        
        console.log(`Network error, retrying in ${delay}ms (attempt ${nextAttempt})`);
        
        // Create retry function
        const retry = () => {
          if (context.onRecoveryStart) context.onRecoveryStart();
          
          context.createTimeout(() => {
            try {
              if (context.isListening) {
                recognition.start();
                if (context.onRecoveryComplete) context.onRecoveryComplete();
              }
            } catch (err) {
              console.error('Failed to restart after network error:', err);
              if (context.onError) context.onError('Network error. Please check your connection and try again.');
            }
          }, delay);
        };
        
        // Auto-retry
        context.createTimeout(retry, 0);
        
        return {
          severity: 'medium',
          message: 'Connection issue detected. Attempting to reconnect...',
          recoverable: true,
          retry
        };
      }
      
      // Too many retries
      if (context.onError) context.onError('Network issues prevented recording. Please try again later.');
      return {
        severity: 'high',
        message: 'Network issues prevented recording. Please try again later.',
        recoverable: false
      };
      
    case 'not-allowed':
      if (context.onError) context.onError('Microphone access was denied. Please enable microphone access in your settings.');
      return {
        severity: 'high',
        message: 'Microphone access was denied. Please enable microphone access in your settings.',
        recoverable: false
      };
      
    case 'audio-capture':
      if (context.onError) context.onError('No microphone was found or it is being used by another application.');
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
      if (context.isListening) {
        console.log('Unexpected abort, attempting to restart');
        
        const retry = () => {
          if (context.onRecoveryStart) context.onRecoveryStart();
          
          context.createTimeout(() => {
            try {
              recognition.start();
              if (context.onRecoveryComplete) context.onRecoveryComplete();
            } catch (err) {
              console.error('Failed to restart after abort:', err);
              if (context.onError) context.onError('Failed to restart. Please try again.');
            }
          }, 300);
        };
        
        // Auto-retry
        context.createTimeout(retry, 0);
        
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
      if (context.onError) context.onError(`Recognition error: ${error.error}`);
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
  context: ErrorHandlerContext
): ErrorResponse => {
  // Similar to handlePwaError but with browser-specific optimizations
  // Get current recognition instance
  const recognition = context.recognitionRef.current;
  if (!recognition) {
    if (context.onError) context.onError('Speech recognition not available');
    return {
      severity: 'high',
      message: 'Speech recognition not available',
      recoverable: false
    };
  }
  
  // Handle different error types - desktop browsers are generally more reliable
  switch (error.error) {
    case 'not-allowed':
      if (context.onError) context.onError('Microphone access was denied. Please enable microphone access in your browser settings.');
      return {
        severity: 'high',
        message: 'Microphone access was denied. Please enable microphone access in your browser settings.',
        recoverable: false
      };
      
    case 'audio-capture':
      if (context.onError) context.onError('No microphone was found or it is being used by another application.');
      return {
        severity: 'high',
        message: 'No microphone was found or it is being used by another application.',
        recoverable: false
      };
      
    case 'network':
      // Standard browsers generally recover better from network issues
      if ((context.retryAttemptsRef.current || 0) < 3) { // Using 3 as max retries
        // Instead of directly modifying .current
        const currentAttempts = (context.retryAttemptsRef.current || 0);
        
        const retry = () => {
          if (context.onRecoveryStart) context.onRecoveryStart();
          
          context.createTimeout(() => {
            try {
              if (context.isListening) {
                recognition.start();
                if (context.onRecoveryComplete) context.onRecoveryComplete();
              }
            } catch (err) {
              console.error('Failed to restart:', err);
              if (context.onError) context.onError('Failed to restart recording.');
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
      
      if (context.onError) context.onError('Network issues prevented recording. Please try again.');
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
      if (context.onError) context.onError(`Recognition error: ${error.error}`);
      return {
        severity: 'medium',
        message: `Recognition error: ${error.error}`,
        recoverable: false
      };
  }
};

/**
 * Process transcript with additional error handling
 * @param transcript The transcript to process
 * @param options Processing options and callbacks
 */
export const processTranscriptSafely = async (
  transcript: string,
  options: {
    onError?: (message: string) => void;
    onProcessingStart?: (transcript: string) => void;
    onProcessingComplete?: (result: any) => void;
  }
) => {
  const { onError, onProcessingStart, onProcessingComplete } = options;
  
  if (!transcript || transcript.trim().length === 0) {
    if (onError) onError('No speech was detected. Please try again and speak clearly.');
    return;
  }
  
  try {
    // Signal that processing has started
    if (onProcessingStart) onProcessingStart(transcript);
    
    // Import and use the actual NLP processing
    const { processVoiceInput } = await import('@/services/nlp');
    
    try {
      // Process the transcript
      const result = await processVoiceInput(transcript);
      
      // Signal processing complete with result
      if (onProcessingComplete) onProcessingComplete(result);
      return result;
    } catch (error) {
      console.error('Error processing transcript:', error);
      
      if (onError) onError('Error processing your voice input. Please try again.');
      return null;
    }
  } catch (error) {
    console.error('Error in transcript processing:', error);
    
    if (onError) onError('There was an error processing your speech. Please try again.');
    return null;
  }
};
