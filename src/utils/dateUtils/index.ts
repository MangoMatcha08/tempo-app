
/**
 * Core date utilities providing a unified API for date operations
 */

// Core date validation and conversion
export {
  ensureValidDate,
  isTimeValid,
  isDateValid,
  parseTimeString,
  formatTimeString
} from './core';

// Timezone conversions
import {
  toZonedTime as zonedTime,
  fromZonedTime as fromZoned,
  getUserTimeZone,
  formatWithTimeZone
} from './timezone';

// Re-export timezone functions
export const toZonedTime = zonedTime;
export const fromZonedTime = fromZoned;
export { getUserTimeZone, formatWithTimeZone };

// Date/Time operations
export {
  isDate,
  isConvertibleToDate,
  createDateWithTime,
  adjustDateIfPassed,
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
export const convertToUtc = fromZoned;
export const convertToLocal = zonedTime;
