import { isValid, isBefore, isAfter } from 'date-fns';
import { ensureValidDate } from './core';
import { toZonedTime } from './timezone';

export interface DateValidationError {
  code: string;
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
      code: 'REQUIRED',
      message: 'Date is required'
    });
    return { isValid: false, sanitizedValue: undefined, errors };
  }
  
  // Try to convert to valid date
  let sanitizedValue: Date | undefined;
  try {
    sanitizedValue = date ? ensureValidDate(date) : undefined;
    if (sanitizedValue && !isValid(sanitizedValue)) {
      errors.push({
        code: 'INVALID_FORMAT',
        message: 'Invalid date format'
      });
    }
  } catch {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Invalid date format'
    });
  }
  
  // Apply timezone if specified
  if (sanitizedValue && options.timeZone) {
    try {
      sanitizedValue = toZonedTime(sanitizedValue, options.timeZone);
    } catch (e) {
      errors.push({
        code: 'TIMEZONE_ERROR',
        message: 'Error converting timezone'
      });
    }
  }
  
  // Validate range if date is valid
  if (sanitizedValue && errors.length === 0) {
    if (options.minDate && isBefore(sanitizedValue, options.minDate)) {
      errors.push({
        code: 'BEFORE_MIN_DATE',
        message: 'Date is before minimum allowed date'
      });
    }
    
    if (options.maxDate && isAfter(sanitizedValue, options.maxDate)) {
      errors.push({
        code: 'AFTER_MAX_DATE',
        message: 'Date is after maximum allowed date'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: errors.length === 0 ? sanitizedValue : undefined,
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
