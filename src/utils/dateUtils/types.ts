
// Core date types
export interface TimeComponents {
  hours: number;
  minutes: number;
}

// Validation types
export enum DateValidationErrorType {
  REQUIRED = 'REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  TIMEZONE_ERROR = 'TIMEZONE_ERROR',
  BEFORE_MIN_DATE = 'BEFORE_MIN_DATE',
  AFTER_MAX_DATE = 'AFTER_MAX_DATE'
}

export interface DateValidationError {
  type: DateValidationErrorType;
  message: string;
}

export interface DateValidationResult {
  isValid: boolean;
  sanitizedValue?: Date;
  errors: DateValidationError[];
}

export interface DateValidationOptions {
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  timeZone?: string;
  allowFutureDates?: boolean;
  allowPastDates?: boolean;
}

// Error message mappings
export const ValidationErrorMessages: Record<DateValidationErrorType, string> = {
  [DateValidationErrorType.REQUIRED]: 'Date is required',
  [DateValidationErrorType.INVALID_FORMAT]: 'Invalid date format',
  [DateValidationErrorType.OUT_OF_RANGE]: 'Date is out of valid range',
  [DateValidationErrorType.TIMEZONE_ERROR]: 'Error converting timezone',
  [DateValidationErrorType.BEFORE_MIN_DATE]: 'Date is before minimum allowed date',
  [DateValidationErrorType.AFTER_MAX_DATE]: 'Date is after maximum allowed date'
};
