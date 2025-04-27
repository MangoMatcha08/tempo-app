
// Core date utilities
export {
  isDate,
  ensureValidDate,
  isTimeValid,
  parseTimeString,
  parseTimeComponents,
  isConvertibleToDate,
  logDateDetails
} from './core';

// Timezone utilities
export {
  toZonedTime,
  fromZonedTime,
  formatWithTimeZone,
  getUserTimeZone
} from './timezoneUtils';

// Adjustment utilities
export { adjustDateIfPassed } from './adjustment';

// Re-export types and constants
export type {
  TimeComponents,
  DateValidationError,
  DateValidationResult,
  DateValidationOptions
} from './types';

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

// Re-export validation functions
export {
  validateDate,
  validateDateRange
} from './validation';

// Date operations
export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  const validDate = new Date(date);
  validDate.setHours(hours, minutes, 0, 0);
  return validDate;
}
