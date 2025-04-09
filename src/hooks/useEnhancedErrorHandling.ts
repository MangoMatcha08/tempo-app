
import { useCallback } from 'react';
import useErrorHandler, { ErrorResponse } from '@/hooks/useErrorHandler';
import { classifyIOSPushError, RecoveryAction } from '@/utils/iosErrorHandler';
import { getUserFriendlyErrorMessage } from '@/lib/firebase/error-utils';
import { errorTelemetry } from '@/utils/errorTelemetry';

/**
 * Hook that enhances error handling with domain-specific knowledge
 */
export function useEnhancedErrorHandling() {
  const { handleError, lastError, clearError } = useErrorHandler();
  
  /**
   * Handle iOS push notification errors
   */
  const handleIOSPushError = useCallback((error: unknown, context?: Record<string, any>) => {
    // First, classify using the specialized iOS error handler
    const classifiedError = classifyIOSPushError(error, context);
    
    // Convert to standard error response
    const errorResponse: ErrorResponse = {
      message: classifiedError.userMessage,
      severity: classifiedError.category.includes('denied') ? 'medium' : 'high',
      recoverable: classifiedError.recoveryActions.length > 0,
      technicalDetails: classifiedError.technicalDetails,
      source: 'ios-push-notification',
      code: classifiedError.category,
      timestamp: Date.now(),
      retry: classifiedError.recoveryActions[0]?.action
    };
    
    // Report to telemetry
    errorTelemetry.reportError(errorResponse);
    
    return errorResponse;
  }, []);
  
  /**
   * Handle speech recognition errors
   */
  const handleSpeechRecognitionError = useCallback((error: SpeechRecognitionErrorEvent) => {
    const errorResponse: ErrorResponse = {
      message: `Speech recognition error: ${error.error}`,
      severity: error.error === 'no-speech' ? 'low' : 'medium',
      recoverable: ['no-speech', 'network', 'aborted'].includes(error.error),
      technicalDetails: `Speech recognition error: ${error.error} - ${error.message}`,
      source: 'speech-recognition',
      code: error.error,
      timestamp: Date.now()
    };
    
    // Only report non-trivial errors
    if (error.error !== 'no-speech') {
      errorTelemetry.reportError(errorResponse);
    }
    
    return errorResponse;
  }, []);
  
  /**
   * Handle Firebase errors
   */
  const handleFirebaseError = useCallback((error: unknown) => {
    const errorResponse: ErrorResponse = {
      message: getUserFriendlyErrorMessage(error),
      severity: 'medium',
      recoverable: true,
      technicalDetails: error instanceof Error ? error.message : String(error),
      source: 'firebase',
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
      timestamp: Date.now()
    };
    
    errorTelemetry.reportError(errorResponse);
    return errorResponse;
  }, []);

  return {
    // Standard error handling
    handleError,
    lastError,
    clearError,
    
    // Domain-specific handlers
    handleIOSPushError,
    handleSpeechRecognitionError,
    handleFirebaseError,
    
    // Reporting utilities
    reportErrorToTelemetry: errorTelemetry.reportError.bind(errorTelemetry)
  };
}

export default useEnhancedErrorHandling;
