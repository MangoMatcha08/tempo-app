
import { isValid, isAfter, isBefore, parse } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface DateValidationResult {
  isValid: boolean;
  sanitizedValue?: Date;
  errors: Array<{
    code: string;
    message: string;
  }>;
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
  const errors: Array<{ code: string; message: string }> = [];
  
  // Handle null/undefined
  if (!date) {
    if (options.required) {
      errors.push({
        code: 'REQUIRED',
        message: 'Date is required'
      });
    }
    return { isValid: !options.required, errors };
  }
  
  // Convert to Date object
  let sanitizedDate: Date | undefined;
  try {
    sanitizedDate = date instanceof Date ? date : new Date(date);
    if (!isValid(sanitizedDate)) {
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
  if (sanitizedDate && options.timeZone) {
    try {
      sanitizedDate = toZonedTime(sanitizedDate, options.timeZone);
    } catch (e) {
      console.error('Timezone conversion error:', e);
      errors.push({
        code: 'TIMEZONE_ERROR',
        message: 'Error converting timezone'
      });
    }
  }
  
  // Validate range
  if (sanitizedDate && errors.length === 0) {
    if (options.minDate && isBefore(sanitizedDate, options.minDate)) {
      errors.push({
        code: 'BEFORE_MIN_DATE',
        message: 'Date is before minimum allowed date'
      });
    }
    
    if (options.maxDate && isAfter(sanitizedDate, options.maxDate)) {
      errors.push({
        code: 'AFTER_MAX_DATE',
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
