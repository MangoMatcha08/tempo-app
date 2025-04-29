
/**
 * Core date types for the application
 */

/**
 * Time components representation
 */
export interface TimeComponents {
  hours: number;
  minutes: number;
}

/**
 * Options for date validation
 */
export interface DateValidationOptions {
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  allowPastDates?: boolean;
  allowFutureDates?: boolean;
  timeZone?: string;
}

/**
 * Error types for date validation
 */
export enum DateValidationErrorType {
  REQUIRED = 'REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  BEFORE_MIN_DATE = 'BEFORE_MIN_DATE',
  AFTER_MAX_DATE = 'AFTER_MAX_DATE',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  TIMEZONE_ERROR = 'TIMEZONE_ERROR'
}

/**
 * Standard date validation error
 */
export interface DateValidationError {
  type: DateValidationErrorType;
  message: string;
}

/**
 * Result of date validation
 */
export interface DateValidationResult {
  isValid: boolean;
  errors: DateValidationError[];
  sanitizedValue?: Date;
}

/**
 * Common date formats
 */
export enum DateFormats {
  ISO = 'yyyy-MM-dd',
  DISPLAY = 'MMMM d, yyyy',
  SHORT = 'MMM d',
  TIME = 'h:mm a',
  FULL = 'PPPppp',
  TIMESTAMP = 'yyyy-MM-dd\'T\'HH:mm:ssXXX'
}

/**
 * Standard error messages for validation errors
 */
export const ValidationErrorMessages = {
  [DateValidationErrorType.REQUIRED]: 'Date is required',
  [DateValidationErrorType.INVALID_FORMAT]: 'Invalid date format',
  [DateValidationErrorType.BEFORE_MIN_DATE]: 'Date is before minimum allowed date',
  [DateValidationErrorType.AFTER_MAX_DATE]: 'Date is after maximum allowed date',
  [DateValidationErrorType.OUT_OF_RANGE]: 'Date is out of allowed range',
  [DateValidationErrorType.TIMEZONE_ERROR]: 'Error converting timezone'
};
