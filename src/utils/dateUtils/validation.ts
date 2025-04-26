import { isValid, isBefore, isAfter } from 'date-fns';
import { ensureValidDate } from './core';
import { toZonedTime } from './timezone';

export interface DateValidationError {
  type: string;
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
}

export function validateDate(
  date: Date | string | null | undefined,
  options: DateValidationOptions = {}
): DateValidationResult {
  const errors: DateValidationError[] = [];
  
  // Handle required validation
  if (!date && options.required) {
    errors.push({
      type: 'REQUIRED',
      message: 'Date is required'
    });
    return { isValid: false, errors };
  }
  
  // Try to convert to valid date
  let sanitizedDate: Date | undefined;
  try {
    sanitizedDate = date ? ensureValidDate(date) : undefined;
    if (sanitizedDate && !isValid(sanitizedDate)) {
      errors.push({
        type: 'INVALID_FORMAT',
        message: 'Invalid date format'
      });
    }
  } catch {
    errors.push({
      type: 'INVALID_FORMAT',
      message: 'Invalid date format'
    });
  }
  
  // Apply timezone if specified
  if (sanitizedDate && options.timeZone) {
    try {
      sanitizedDate = toZonedTime(sanitizedDate, options.timeZone);
    } catch (e) {
      errors.push({
        type: 'TIMEZONE_ERROR',
        message: 'Error converting timezone'
      });
    }
  }
  
  // Validate range if date is valid
  if (sanitizedDate && errors.length === 0) {
    if (options.minDate && isBefore(sanitizedDate, options.minDate)) {
      errors.push({
        type: 'BEFORE_MIN_DATE',
        message: 'Date is before minimum allowed date'
      });
    }
    
    if (options.maxDate && isAfter(sanitizedDate, options.maxDate)) {
      errors.push({
        type: 'AFTER_MAX_DATE',
        message: 'Date is after maximum allowed date'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: errors.length === 0 ? sanitizedDate : undefined,
    errors
  };
}

export function validateDateRange(
  startDate: Date,
  endDate: Date,
  options: DateValidationOptions = {}
): { 
  isValid: boolean;
  startDate: DateValidationResult;
  endDate: DateValidationResult;
} {
  const startValidation = validateDate(startDate, options);
  const endValidation = validateDate(endDate, {
    ...options,
    minDate: startValidation.sanitizedValue
  });
  
  return {
    isValid: startValidation.isValid && endValidation.isValid,
    startDate: startValidation,
    endDate: endValidation
  };
}
