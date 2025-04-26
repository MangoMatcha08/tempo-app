
import { isValid, isBefore, isAfter } from 'date-fns';
import { ensureValidDate } from './core';
import { toZonedTime } from './timezone';
import { DateValidationErrorType } from './types';
import type { DateValidationError, DateValidationResult, DateValidationOptions } from './types';

export function validateDate(
  date: Date | string | null | undefined,
  options: DateValidationOptions = {}
): DateValidationResult {
  const errors: DateValidationError[] = [];
  
  // Handle required validation
  if (!date && options.required) {
    errors.push({
      type: DateValidationErrorType.REQUIRED,
      message: 'Date is required'
    });
    return { isValid: false, errors };
  }
  
  // Try to convert to valid date
  let sanitizedDate: Date | undefined;
  try {
    sanitizedDate = date ? ensureValidDate(date) : undefined;
  } catch (e) {
    errors.push({
      type: DateValidationErrorType.INVALID_FORMAT,
      message: 'Invalid date format'
    });
    return { isValid: false, errors };
  }
  
  if (!sanitizedDate || !isValid(sanitizedDate)) {
    errors.push({
      type: DateValidationErrorType.INVALID_FORMAT,
      message: 'Invalid date format'
    });
    return { isValid: false, errors };
  }
  
  // Apply timezone if specified
  if (sanitizedDate && options.timeZone) {
    try {
      sanitizedDate = toZonedTime(sanitizedDate, options.timeZone);
    } catch (e) {
      errors.push({
        type: DateValidationErrorType.TIMEZONE_ERROR,
        message: 'Error converting timezone'
      });
    }
  }
  
  // Validate range if date is valid
  if (sanitizedDate && errors.length === 0) {
    const now = new Date();
    
    // Check past/future date constraints
    if (options.allowPastDates === false && isBefore(sanitizedDate, now)) {
      errors.push({
        type: DateValidationErrorType.OUT_OF_RANGE,
        message: 'Past dates are not allowed'
      });
    }
    
    if (options.allowFutureDates === false && isAfter(sanitizedDate, now)) {
      errors.push({
        type: DateValidationErrorType.OUT_OF_RANGE,
        message: 'Future dates are not allowed'
      });
    }
    
    // Check explicit min/max date constraints
    if (options.minDate && isBefore(sanitizedDate, options.minDate)) {
      errors.push({
        type: DateValidationErrorType.BEFORE_MIN_DATE,
        message: 'Date is before minimum allowed date'
      });
    }
    
    if (options.maxDate && isAfter(sanitizedDate, options.maxDate)) {
      errors.push({
        type: DateValidationErrorType.AFTER_MAX_DATE,
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
