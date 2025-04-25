
import { parse, isValid, isAfter, isBefore, isEqual } from 'date-fns';
import { ensureValidDate } from './enhancedDateUtils';

/**
 * Date validation error types
 */
export enum DateValidationErrorType {
  INVALID_FORMAT = 'invalid_format',
  EMPTY_VALUE = 'empty_value',
  FUTURE_DATE = 'future_date',
  PAST_DATE = 'past_date',
  OUT_OF_RANGE = 'out_of_range',
  WEEKEND = 'weekend',
  HOLIDAY = 'holiday',
  TOO_OLD = 'too_old',
  TOO_RECENT = 'too_recent',
  INVALID_TIME = 'invalid_time'
}

/**
 * Date validation result
 */
export interface DateValidationResult {
  isValid: boolean;
  errors: Array<{
    type: DateValidationErrorType;
    message: string;
  }>;
  sanitizedValue: Date | null;
}

/**
 * Date validation options
 */
export interface DateValidationOptions {
  required?: boolean;
  allowFutureDates?: boolean;
  allowPastDates?: boolean;
  minDate?: Date;
  maxDate?: Date;
  allowWeekends?: boolean;
  allowHolidays?: boolean;
  timeRequired?: boolean;
  format?: string;
}

/**
 * Commonly used date formats
 */
export const DateFormats = {
  ISO: 'yyyy-MM-dd',
  US: 'MM/dd/yyyy',
  EUROPEAN: 'dd/MM/yyyy',
  ISO_WITH_TIME: 'yyyy-MM-dd HH:mm',
  FULL: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'
};

/**
 * US holidays (simplified - just for example)
 */
const US_HOLIDAYS_2023 = [
  new Date(2023, 0, 1),  // New Year's Day
  new Date(2023, 0, 16), // MLK Day
  new Date(2023, 1, 20), // Presidents Day
  new Date(2023, 4, 29), // Memorial Day
  new Date(2023, 6, 4),  // Independence Day
  new Date(2023, 8, 4),  // Labor Day
  new Date(2023, 10, 11), // Veterans Day
  new Date(2023, 10, 23), // Thanksgiving
  new Date(2023, 11, 25)  // Christmas
];

/**
 * Check if a date is a holiday (simplified implementation)
 * In a real app, this would use a proper holiday calendar
 */
function isHoliday(date: Date): boolean {
  return US_HOLIDAYS_2023.some(holiday => 
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
}

/**
 * Check if a date is a weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Validate a date string with configurable options
 */
export function validateDate(
  value: string | Date | null | undefined,
  options: DateValidationOptions = {}
): DateValidationResult {
  const {
    required = false,
    allowFutureDates = true,
    allowPastDates = true,
    minDate,
    maxDate,
    allowWeekends = true,
    allowHolidays = true,
    timeRequired = false,
    format = DateFormats.ISO
  } = options;
  
  const errors: DateValidationResult['errors'] = [];
  let sanitizedValue: Date | null = null;
  
  // Check if empty
  if (!value) {
    if (required) {
      errors.push({
        type: DateValidationErrorType.EMPTY_VALUE,
        message: 'Date is required'
      });
    }
    return { isValid: !required, errors, sanitizedValue };
  }
  
  // Convert to Date object
  try {
    if (typeof value === 'string') {
      sanitizedValue = parse(value, format, new Date());
      if (!isValid(sanitizedValue)) {
        throw new Error('Invalid date format');
      }
    } else {
      sanitizedValue = ensureValidDate(value);
    }
  } catch (e) {
    errors.push({
      type: DateValidationErrorType.INVALID_FORMAT,
      message: `Date must be in ${format} format`
    });
    return { isValid: false, errors, sanitizedValue: null };
  }
  
  // Validate time if required
  if (timeRequired && sanitizedValue) {
    const hasTime = sanitizedValue.getHours() !== 0 || sanitizedValue.getMinutes() !== 0;
    if (!hasTime) {
      errors.push({
        type: DateValidationErrorType.INVALID_TIME,
        message: 'Time is required'
      });
    }
  }
  
  // Check future date constraint
  const now = new Date();
  if (!allowFutureDates && isAfter(sanitizedValue, now)) {
    errors.push({
      type: DateValidationErrorType.FUTURE_DATE,
      message: 'Future dates are not allowed'
    });
  }
  
  // Check past date constraint
  if (!allowPastDates && isBefore(sanitizedValue, now)) {
    errors.push({
      type: DateValidationErrorType.PAST_DATE,
      message: 'Past dates are not allowed'
    });
  }
  
  // Check min date constraint
  if (minDate && isBefore(sanitizedValue, minDate)) {
    errors.push({
      type: DateValidationErrorType.TOO_OLD,
      message: `Date cannot be before ${format ? format(minDate, format) : minDate.toDateString()}`
    });
  }
  
  // Check max date constraint
  if (maxDate && isAfter(sanitizedValue, maxDate)) {
    errors.push({
      type: DateValidationErrorType.TOO_RECENT,
      message: `Date cannot be after ${format ? format(maxDate, format) : maxDate.toDateString()}`
    });
  }
  
  // Check weekend constraint
  if (!allowWeekends && isWeekend(sanitizedValue)) {
    errors.push({
      type: DateValidationErrorType.WEEKEND,
      message: 'Weekend dates are not allowed'
    });
  }
  
  // Check holiday constraint
  if (!allowHolidays && isHoliday(sanitizedValue)) {
    errors.push({
      type: DateValidationErrorType.HOLIDAY,
      message: 'Holiday dates are not allowed'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
}

/**
 * Sanitize a date input for safe use
 */
export function sanitizeDate(value: any, fallback: Date = new Date()): Date {
  if (!value) return fallback;
  
  try {
    return ensureValidDate(value);
  } catch (e) {
    console.warn('Error sanitizing date', e);
    return fallback;
  }
}

/**
 * Validate a date range
 */
export function validateDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  options: DateValidationOptions & {
    allowEqualDates?: boolean;
    minRangeDays?: number;
    maxRangeDays?: number;
  } = {}
): {
  isValid: boolean;
  errors: string[];
  startDate: Date | null;
  endDate: Date | null;
} {
  const {
    allowEqualDates = true,
    minRangeDays,
    maxRangeDays,
    ...dateOptions
  } = options;
  
  const startResult = validateDate(startDate, dateOptions);
  const endResult = validateDate(endDate, dateOptions);
  
  const errors: string[] = [
    ...startResult.errors.map(e => `Start date: ${e.message}`),
    ...endResult.errors.map(e => `End date: ${e.message}`)
  ];
  
  const validStartDate = startResult.sanitizedValue;
  const validEndDate = endResult.sanitizedValue;
  
  // Only proceed with range validation if both dates are individually valid
  if (validStartDate && validEndDate) {
    // Check start date before end date
    if (isAfter(validStartDate, validEndDate)) {
      errors.push('Start date must be before end date');
    }
    
    // Check equal dates
    if (!allowEqualDates && isEqual(validStartDate, validEndDate)) {
      errors.push('Start and end dates cannot be the same');
    }
    
    // Check minimum range
    if (minRangeDays) {
      const minEndDate = new Date(validStartDate);
      minEndDate.setDate(minEndDate.getDate() + minRangeDays);
      
      if (isBefore(validEndDate, minEndDate)) {
        errors.push(`Date range must be at least ${minRangeDays} days`);
      }
    }
    
    // Check maximum range
    if (maxRangeDays) {
      const maxEndDate = new Date(validStartDate);
      maxEndDate.setDate(maxEndDate.getDate() + maxRangeDays);
      
      if (isAfter(validEndDate, maxEndDate)) {
        errors.push(`Date range cannot exceed ${maxRangeDays} days`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    startDate: validStartDate,
    endDate: validEndDate
  };
}

/**
 * Get earliest valid date based on constraints
 */
export function getEarliestValidDate(options: DateValidationOptions = {}): Date {
  const { minDate, allowWeekends, allowHolidays } = options;
  let candidate = minDate ? new Date(minDate) : new Date();
  
  // Ensure it's a valid date according to constraints
  while (
    (!allowWeekends && isWeekend(candidate)) ||
    (!allowHolidays && isHoliday(candidate))
  ) {
    candidate.setDate(candidate.getDate() + 1);
  }
  
  return candidate;
}
