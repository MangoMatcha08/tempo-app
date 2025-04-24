import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { getUserFriendlyErrorMessage } from '@/lib/firebase/error-utils';
import { TimingMetadata } from '@/types/telemetry/telemetryTypes';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',     // Minor issues, can be ignored
  MEDIUM = 'medium', // Impacts functionality but app can continue
  HIGH = 'high',     // Critical issues requiring immediate attention
  FATAL = 'fatal'    // Application cannot continue
}

/**
 * Standardized error response structure
 */
export interface ErrorResponse {
  message: string;        // User-friendly message
  severity: ErrorSeverity; // Error severity level
  recoverable: boolean;   // Can the error be recovered from?
  technicalDetails?: string; // Technical details (for developers/logs)
  code?: string;          // Error code for categorization
  source?: string;        // Component or service that threw the error
  timestamp?: number;     // When the error occurred
  retry?: () => void;     // Optional retry function
  metadata?: TimingMetadata; // Performance and telemetry metadata
}

/**
 * Classification of errors between system and user errors
 */
export enum ErrorCategory {
  USER_ERROR = 'user-error',     // User can fix (permissions, input, etc)
  SYSTEM_ERROR = 'system-error', // System issue (network, server, etc)
  UNKNOWN = 'unknown'           // Uncategorized errors
}

/**
 * Options for error handler configuration
 */
interface ErrorHandlerOptions {
  showToasts?: boolean;
  logToConsole?: boolean;
  reportToTelemetry?: boolean;
}

/**
 * Hook for handling errors consistently across the application
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    showToasts = true,
    logToConsole = true,
    reportToTelemetry = true
  } = options;
  
  const [lastError, setLastError] = useState<ErrorResponse | null>(null);
  
  /**
   * Classify an error as user-fixable or system error
   */
  const classifyError = useCallback((error: unknown): ErrorCategory => {
    if (!error) return ErrorCategory.UNKNOWN;
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // User permission errors
    if (
      errorMsg.includes('permission') || 
      errorMsg.includes('access') || 
      errorMsg.includes('not allowed') ||
      errorMsg.includes('unauthorized')
    ) {
      return ErrorCategory.USER_ERROR;
    }
    
    // Network and system errors
    if (
      errorMsg.includes('network') || 
      errorMsg.includes('connection') || 
      errorMsg.includes('server') ||
      errorMsg.includes('timeout') ||
      errorMsg.includes('unavailable')
    ) {
      return ErrorCategory.SYSTEM_ERROR;
    }
    
    return ErrorCategory.UNKNOWN;
  }, []);
  
  /**
   * Process and handle any type of error
   */
  const handleError = useCallback((error: unknown, context?: Record<string, any>): ErrorResponse => {
    // Format any error into our standard structure
    const errorCategory = classifyError(error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Create standardized error response
    const errorResponse: ErrorResponse = {
      message: getUserFriendlyErrorMessage(error),
      severity: errorCategory === ErrorCategory.USER_ERROR ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH,
      recoverable: errorCategory === ErrorCategory.USER_ERROR,
      technicalDetails: errorMsg,
      source: context?.source || 'unknown',
      timestamp: Date.now(),
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined
    };
    
    // Log to console if enabled
    if (logToConsole) {
      console.error(
        `[ErrorHandler] ${errorResponse.severity.toUpperCase()} - ${errorResponse.message}`,
        { error, context, response: errorResponse }
      );
    }
    
    // Show toast notification if enabled
    if (showToasts) {
      toast({
        title: errorCategory === ErrorCategory.USER_ERROR ? "Action Required" : "Something went wrong",
        description: errorResponse.message,
        variant: errorResponse.severity === ErrorSeverity.HIGH || errorResponse.severity === ErrorSeverity.FATAL 
          ? "destructive" 
          : "default",
      });
    }
    
    // Report to telemetry if enabled
    if (reportToTelemetry) {
      // This will be implemented with the telemetry system
      // reportErrorToTelemetry(errorResponse);
    }
    
    // Update state with the latest error
    setLastError(errorResponse);
    
    return errorResponse;
  }, [classifyError, logToConsole, reportToTelemetry, showToasts]);
  
  return {
    handleError,
    classifyError,
    lastError,
    clearError: () => setLastError(null),
  };
}

export default useErrorHandler;
