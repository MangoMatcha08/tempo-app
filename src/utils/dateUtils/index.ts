
// Core date utilities
export {
  isDate,
  ensureValidDate,
  isTimeValid,
  parseTimeString,
  parseTimeComponents,
  isConvertibleToDate,
  createDateWithTime,
  logDateDetails as debugDate,
  type TimeComponents
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

// Period time utilities
export {
  applyPeriodTime,
  validatePeriodId,
  getPeriodById,
  hasPeriodTime
} from './periodTime';

// Re-export transformation functions
export {
  parseStringToDate,
  isDateInRange,
  areDatesEqual,
  convertToUtc,
  convertToLocal
} from './transformation';

// Adding recurrence functionality
export {
  generateOccurrences,
  RecurrenceType,
  type RecurrenceRule,
  findAvailableTimeSlots,
  suggestIdealPeriods,
  suggestDueDates,
  detectDateConflicts,
  memoizeDateFn
} from './recurrence';

// Performance monitoring
export {
  datePerformance
} from './performance';
