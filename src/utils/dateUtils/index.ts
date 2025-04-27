
// Core date utilities
export {
  isDate,
  ensureValidDate,
  isTimeValid,
  parseTimeComponents,
  isConvertibleToDate,
  logDateDetails
} from './core';

// Timezone utilities
export {
  toZonedTime as convertToLocal,
  fromZonedTime as convertToUtc,
  formatWithTimeZone,
  getUserTimeZone
} from './timezoneUtils';

// Adjustment utilities
export { adjustDateIfPassed } from './adjustment';

// Re-export types
export type {
  TimeComponents,
  DateValidationError,
  DateValidationResult,
  DateValidationOptions
} from './types';

// Re-export enums and constants
export {
  DateFormats,
  DateValidationErrorType,
  ValidationErrorMessages
} from './types';

// Formatting utilities
export {
  formatDate,
  formatDateRange,
  formatTimeString
} from './formatting';

// Date operations
export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  const validDate = ensureValidDate(date);
  const newDate = new Date(validDate);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

// Re-export validation functions
export {
  validateDate,
  validateDateRange
} from './validation';
