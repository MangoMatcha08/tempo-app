import { isValid, isAfter, isBefore, parse } from 'date-fns';

/**
 * Supported date format types for validation
 */
export enum DateFormats {
  ISO = 'ISO',
  US = 'US',
  EU = 'EU',
  CUSTOM = 'CUSTOM'
}

/**
 * Types of validation errors that can occur during date operations
 */
export enum DateValidationErrorType {
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  REQUIRED = 'REQUIRED',
  FUTURE_DATE = 'FUTURE_DATE',
  PAST_DATE = 'PAST_DATE'
}

/**
 * User-friendly error messages for each validation error type
 */
export const ValidationErrorMessages: Record<DateValidationErrorType, string> = {
  [DateValidationErrorType.INVALID_FORMAT]: 'Invalid date format',
  [DateValidationErrorType.OUT_OF_RANGE]: 'Date is out of allowed range',
  [DateValidationErrorType.REQUIRED]: 'Date is required',
  [DateValidationErrorType.FUTURE_DATE]: 'Future dates are not allowed',
  [DateValidationErrorType.PAST_DATE]: 'Past dates are not allowed'
};

/**
 * Represents a validation error with its type and message
 */
interface DateValidationError {
  type: DateValidationErrorType;
  message: string;
}

/**
 * Creates a standardized validation error object
 * @param type - The type of validation error
 * @returns A validation error object with type and message
 */
const createValidationError = (type: DateValidationErrorType): DateValidationError => ({
  type,
  message: ValidationErrorMessages[type]
});

/**
 * Options for configuring date validation behavior
 */
export interface DateValidationOptions {
  /** Whether the date is required */
  required?: boolean;
  /** Minimum allowed date */
  minDate?: Date;
  /** Maximum allowed date */
  maxDate?: Date;
  /** Whether future dates are allowed */
  allowFutureDates?: boolean;
  /** Whether past dates are allowed */
  allowPastDates?: boolean;
  /** Expected date format */
  format?: DateFormats | string;
}

/**
 * Result of a date validation operation
 */
export interface DateValidationResult {
  /** Whether the date is valid according to all rules */
  isValid: boolean;
  /** The sanitized date value if valid */
  sanitizedValue?: Date;
  /** Array of validation errors if any */
  errors: DateValidationError[];
  /** The original input value */
  originalValue: any;
}

/**
 * Validates a date value
 * @param date Date to validate
 * @param options Validation options
 * @returns Validation result
 */
export const validateDate = (
  date: Date | string | null | undefined,
  options: DateValidationOptions = {}
): DateValidationResult => {
  const errors: DateValidationError[] = [];
  let sanitizedDate: Date | undefined;
  
  // Handle null or undefined
  if (date === null || date === undefined) {
    if (options.required) {
      errors.push(createValidationError(DateValidationErrorType.REQUIRED));
    }
    return {
      isValid: !options.required,
      errors,
      originalValue: date
    };
  }
  
  // Convert string to date if needed
  if (typeof date === 'string') {
    try {
      sanitizedDate = new Date(date);
      if (isNaN(sanitizedDate.getTime())) {
        errors.push(createValidationError(DateValidationErrorType.INVALID_FORMAT));
      }
    } catch {
      errors.push(createValidationError(DateValidationErrorType.INVALID_FORMAT));
    }
  } else if (date instanceof Date) {
    sanitizedDate = new Date(date);
    if (isNaN(sanitizedDate.getTime())) {
      errors.push(createValidationError(DateValidationErrorType.INVALID_FORMAT));
    }
  } else {
    errors.push(createValidationError(DateValidationErrorType.INVALID_FORMAT));
  }
  
  // Check range constraints if we have a valid date
  if (sanitizedDate && errors.length === 0) {
    const now = new Date();
    
    if (options.minDate && sanitizedDate < options.minDate) {
      errors.push(createValidationError(DateValidationErrorType.OUT_OF_RANGE));
    }
    
    if (options.maxDate && sanitizedDate > options.maxDate) {
      errors.push(createValidationError(DateValidationErrorType.OUT_OF_RANGE));
    }
    
    if (options.allowFutureDates === false && sanitizedDate > now) {
      errors.push(createValidationError(DateValidationErrorType.FUTURE_DATE));
    }
    
    if (options.allowPastDates === false && sanitizedDate < now) {
      errors.push(createValidationError(DateValidationErrorType.PAST_DATE));
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: errors.length === 0 ? sanitizedDate : undefined,
    errors,
    originalValue: date
  };
};

/**
 * Validates a date range to ensure the start date is before or equal to the end date
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param options - Validation options to apply to both dates
 * @returns Validation results for both start and end dates
 */
export const validateDateRange = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  options: DateValidationOptions = {}
): {
  isValid: boolean;
  startDate: DateValidationResult;
  endDate: DateValidationResult;
} => {
  const startResult = validateDate(startDate, options);
  const endResult = validateDate(endDate, options);
  
  // Additional validation for range
  if (startResult.isValid && endResult.isValid && 
      startResult.sanitizedValue && endResult.sanitizedValue) {
    if (startResult.sanitizedValue > endResult.sanitizedValue) {
      endResult.errors.push(createValidationError(DateValidationErrorType.OUT_OF_RANGE));
      endResult.isValid = false;
    }
  }
  
  return {
    isValid: startResult.isValid && endResult.isValid,
    startDate: startResult,
    endDate: endResult
  };
};

/**
 * Sanitizes a date input, ensuring a valid Date object is returned
 * @param date - The date input to sanitize
 * @returns A valid Date object or current date if invalid
 */
export const sanitizeDate = (date: any): Date => {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Default to current date
  return new Date();
};

/**
 * Gets the earliest valid date based on validation options
 * @param options - Validation options containing minimum date constraints
 * @returns The earliest valid date according to the options
 */
export const getEarliestValidDate = (options: DateValidationOptions = {}): Date => {
  return options.minDate || new Date();
};
