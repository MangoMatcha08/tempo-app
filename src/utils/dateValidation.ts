
// Re-export from dateUtils for backward compatibility
import { 
  validateDate,
  validateDateRange,
  type DateValidationError,
  type DateValidationResult,
  type DateValidationOptions,
  DateFormats
} from './dateUtils';

export {
  validateDate,
  validateDateRange,
  DateFormats
};

export type {
  DateValidationError,
  DateValidationResult,
  DateValidationOptions
};

// For test compatibility
export enum DateValidationErrorType {
  REQUIRED = 'REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  TIMEZONE_ERROR = 'TIMEZONE_ERROR',
  BEFORE_MIN_DATE = 'BEFORE_MIN_DATE',
  AFTER_MAX_DATE = 'AFTER_MAX_DATE'
}
