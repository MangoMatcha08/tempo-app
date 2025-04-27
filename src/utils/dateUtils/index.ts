
/**
 * Core date utilities providing a unified API for date operations
 */

// Import timezone functions first since they're used in legacy exports
import { toZonedTime, fromZonedTime } from './timezoneUtils';

// Import the adjustment utilities
import { adjustDateIfPassed, isOnDstTransition } from './adjustment';

// Core date validation and conversion
export {
  ensureValidDate,
  isTimeValid,
  isDateValid,
  parseTimeString,
  formatTimeString
} from './core';

// Export the adjustment utilities
export { adjustDateIfPassed, isOnDstTransition };

// Export timezone functions for external use
export {
  toZonedTime,
  fromZonedTime,
  getUserTimeZone,
  formatWithTimeZone
} from './timezoneUtils';

// Date/Time operations
export {
  isDate,
  isConvertibleToDate,
  createDateWithTime,
  parseTimeComponents,
  toLocalTime,
  toUtcTime
} from '../dateTimeUtils';

// Formatting utilities
export {
  formatDate,
  formatDateRange
} from './formatting';

// Validation utilities
export {
  validateDate,
  validateDateRange
} from './validation';

// Debug utilities
export function logDateDetails(label: string, date: unknown): void {
  console.group(`[${label}]`);
  try {
    const validDate = ensureValidDate(date);
    console.log({
      date: validDate.toString(),
      iso: validDate.toISOString(),
      time: validDate.toLocaleTimeString(),
      timestamp: validDate.getTime(),
      isValid: isDate(validDate),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    console.error('Invalid date:', date);
    console.error('Error:', error);
  }
  console.groupEnd();
}

// Type exports
export type {
  TimeComponents,
  DateValidationError,
  DateValidationResult,
  DateValidationOptions
} from './types';

// Export enums and constants
export {
  DateFormats,
  DateValidationErrorType,
  ValidationErrorMessages
} from './types';

// Legacy exports for backward compatibility
export const convertToUtc = fromZonedTime;
export const convertToLocal = toZonedTime;
