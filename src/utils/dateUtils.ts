
// Re-export core utilities
export {
  ensureValidDate,
  convertToUtc,
  convertToLocal,
  debugDate,
  isTimeValid,
  isDateValid
} from './dateCore';

// Export memoization utility
export { memoizeDateFn } from './dateMemoization';

// Export date transformation utilities
export {
  parseStringToDate,
  formatDate,
  compareDates,
  isDateInRange,
  formatWithTimezone,
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
  getUserTimeZone,
  formatDateWithPeriod,
  getRelativeTimeDisplay,
  getNearestPeriodTime,
  formatDisplayDate,
  toLocalTime,
  toUtcTime
} from './enhancedDateUtils';

// Export validation utilities
export type {
  DateValidationOptions,
  DateValidationResult
} from './dateValidation';

export {
  validateDate,
  validateDateRange,
  sanitizeDate,
  DateValidationErrorType,
} from './dateValidation';

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
