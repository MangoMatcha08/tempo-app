/**
 * Core date utilities providing a unified API for date operations
 */

// Import timezone functions first since they're used in legacy exports
import { toZonedTime, fromZonedTime } from './timezoneUtils';

// Import the new adjustment utilities
import { adjustDateIfPassed, isOnDstTransition } from './adjustment';

// Re-export timezone functions for external use
export {
  toZonedTime,
  fromZonedTime,
  getUserTimeZone,
  formatWithTimeZone
} from './timezoneUtils';

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
