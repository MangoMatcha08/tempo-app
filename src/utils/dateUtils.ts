
// Re-export core utilities
export {
  ensureValidDate,
  isTimeValid,
  isDateValid,
  parseTimeString,
  formatTimeString
} from './dateUtils/core';

export {
  formatDate,
  formatDateRange,
  formatWithTimezone,
} from './dateUtils/formatting';

export {
  validateDate,
  validateDateRange,
} from './dateUtils/validation';

export type {
  DateValidationError,
  DateValidationResult,
  DateValidationOptions,
  TimeComponents
} from './dateUtils/types';

export {
  getUserTimeZone,
  toZonedTime,
  fromZonedTime,
  formatWithTimeZone
} from './dateUtils/timezone';

// Export from dateCore for backward compatibility
export {
  convertToUtc,
  convertToLocal,
  debugDate
} from './dateCore';

// Export memoization utility
export { memoizeDateFn } from './dateMemoization';

// Export date transformation utilities
export {
  parseStringToDate,
  compareDates,
  isDateInRange,
  areDatesEqual
} from './dateTransformations';

// Export scheduling utilities
export type {
  TimeSlot
} from './dateSchedulingUtils';

export {
  findAvailableTimeSlots,
  suggestIdealPeriods,
  suggestDueDates,
  detectDateConflicts,
} from './dateSchedulingUtils';

// Export enhanced utilities
export {
  formatDateWithPeriod,
  getRelativeTimeDisplay,
  getNearestPeriodTime,
  formatDisplayDate,
  toLocalTime,
  toUtcTime
} from './enhancedDateUtils';

// Export recurrence utilities
export type {
  RecurrenceRule
} from './recurringDatePatterns';

export {
  RecurrenceType,
  generateOccurrences,
  formatRecurrenceRule,
  dateMatchesRecurrence
} from './recurringDatePatterns';

// Export Period types
export type {
  Period,
  PeriodValidationResult,
  DateWithPeriod
} from '../types/periodTypes';

// Export date performance monitoring
export { datePerformance } from './datePerformanceMonitor';

// Common date formats enum
export enum DateFormats {
  ISO = 'yyyy-MM-dd',
  DISPLAY = 'MMMM d, yyyy',
  SHORT = 'MMM d',
  TIME = 'h:mm a',
  FULL = 'PPPppp'
}
