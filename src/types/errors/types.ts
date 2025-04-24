
/**
 * Core error handling types
 */

export interface ErrorResponse {
  message: string;
  code?: string;
  recoverable: boolean;
  metadata?: Record<string, any>;
}

export type ErrorWithMetadata = Error & {
  code?: string;
  metadata?: Record<string, any>;
};

// Type guard for Error objects
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Type guard for string errors
export function isStringError(error: unknown): error is string {
  return typeof error === 'string';
}

// Helper to safely get error message
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (isStringError(error)) {
    return error;
  }
  return 'Unknown error occurred';
}

