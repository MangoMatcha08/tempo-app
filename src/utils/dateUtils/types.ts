
// Core date types
export interface TimeComponents {
  hours: number;
  minutes: number;
}

// Error types
export enum DateValidationErrorType {
  REQUIRED = 'REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  TIMEZONE_ERROR = 'TIMEZONE_ERROR',
  BEFORE_MIN_DATE = 'BEFORE_MIN_DATE',
  AFTER_MAX_DATE = 'AFTER_MAX_DATE'
}

// Validation types
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

