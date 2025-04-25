import { isValid, isAfter, isBefore, parse } from 'date-fns';

export enum DateFormats {
  ISO = 'ISO',
  US = 'US',
  EU = 'EU',
  CUSTOM = 'CUSTOM'
}

export enum DateValidationErrorType {
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  REQUIRED = 'REQUIRED',
  FUTURE_DATE = 'FUTURE_DATE',
  PAST_DATE = 'PAST_DATE'
}

export interface DateValidationOptions {
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  allowFutureDates?: boolean;
  allowPastDates?: boolean;
  format?: DateFormats | string;
}

export interface DateValidationResult {
  isValid: boolean;
  sanitizedValue?: Date;
  errors: DateValidationErrorType[];
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
  const errors: DateValidationErrorType[] = [];
  let sanitizedDate: Date | undefined;
  
  // Handle null or undefined
  if (date === null || date === undefined) {
    if (options.required) {
      errors.push(DateValidationErrorType.REQUIRED);
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
        errors.push(DateValidationErrorType.INVALID_FORMAT);
      }
    } catch {
      errors.push(DateValidationErrorType.INVALID_FORMAT);
    }
  } else if (date instanceof Date) {
    sanitizedDate = new Date(date);
    if (isNaN(sanitizedDate.getTime())) {
      errors.push(DateValidationErrorType.INVALID_FORMAT);
    }
  } else {
    errors.push(DateValidationErrorType.INVALID_FORMAT);
  }
  
  // Check range constraints if we have a valid date
  if (sanitizedDate && errors.length === 0) {
    const now = new Date();
    
    if (options.minDate && sanitizedDate < options.minDate) {
      errors.push(DateValidationErrorType.OUT_OF_RANGE);
    }
    
    if (options.maxDate && sanitizedDate > options.maxDate) {
      errors.push(DateValidationErrorType.OUT_OF_RANGE);
    }
    
    if (options.allowFutureDates === false && sanitizedDate > now) {
      errors.push(DateValidationErrorType.FUTURE_DATE);
    }
    
    if (options.allowPastDates === false && sanitizedDate < now) {
      errors.push(DateValidationErrorType.PAST_DATE);
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
 * Validates a date range
 * @param startDate Range start date
 * @param endDate Range end date
 * @param options Validation options
 * @returns Validation result for both dates
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
      endResult.errors.push(DateValidationErrorType.OUT_OF_RANGE);
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
 * Sanitizes a date input
 * @param date Date to sanitize
 * @returns Sanitized date or current date if invalid
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
 * Gets earliest valid date from options
 * @param options Validation options
 * @returns Earliest valid date
 */
export const getEarliestValidDate = (options: DateValidationOptions = {}): Date => {
  return options.minDate || new Date();
};
