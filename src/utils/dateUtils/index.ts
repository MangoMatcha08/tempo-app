
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

// Timezone conversions - using new standardized names
export {
  toZonedTime,
  fromZonedTime,
  getUserTimeZone,
  formatWithTimeZone
} from './timezone';

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
  formatDateRange,
  formatTimeWithPeriod
} from './formatting';

// Type exports
export type {
  TimeComponents,
  DateValidationError,
  DateValidationResult,
  DateValidationOptions
} from './types';

// Export date format constants
export { DateFormats } from './types';

// Legacy exports for backward compatibility
export const convertToUtc = fromZonedTime;
export const convertToLocal = toZonedTime;

