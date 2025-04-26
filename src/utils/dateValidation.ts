
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

// Add error message mappings
export const ValidationErrorMessages: Record<DateValidationErrorType, string> = {
  [DateValidationErrorType.REQUIRED]: 'Date is required',
  [DateValidationErrorType.INVALID_FORMAT]: 'Invalid date format',
  [DateValidationErrorType.OUT_OF_RANGE]: 'Date is out of valid range',
  [DateValidationErrorType.TIMEZONE_ERROR]: 'Error converting timezone',
  [DateValidationErrorType.BEFORE_MIN_DATE]: 'Date is before minimum allowed date',
  [DateValidationErrorType.AFTER_MAX_DATE]: 'Date is after maximum allowed date'
};

