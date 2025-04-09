import { ErrorSeverity } from "@/hooks/useErrorHandler";

/**
 * Utility to convert string severity values to ErrorSeverity enum
 * Useful when handling API responses or legacy data
 */
export function toErrorSeverity(severity: string | undefined): ErrorSeverity {
  if (!severity) return ErrorSeverity.LOW;
  
  switch (severity.toLowerCase()) {
    case 'high':
      return ErrorSeverity.HIGH;
    case 'medium':
      return ErrorSeverity.MEDIUM;
    case 'low':
      return ErrorSeverity.LOW;
    case 'fatal':
      return ErrorSeverity.FATAL;
    default:
      console.warn(`Unknown severity value: ${severity}, defaulting to LOW`);
      return ErrorSeverity.LOW;
  }
}

/**
 * Ensures that a severity value is always a valid ErrorSeverity enum
 * Works with both string inputs and existing enum values
 */
export function ensureErrorSeverity(severity: string | ErrorSeverity | undefined): ErrorSeverity {
  if (severity === undefined) return ErrorSeverity.LOW;
  
  // If it's already an enum value, return it directly
  if (Object.values(ErrorSeverity).includes(severity as ErrorSeverity)) {
    return severity as ErrorSeverity;
  }
  
  // Otherwise convert from string
  return toErrorSeverity(severity as string);
}
