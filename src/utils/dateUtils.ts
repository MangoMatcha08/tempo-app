
// Re-export everything from the new structure
export * from './dateUtils/index';

// Re-export from dateCore for backward compatibility
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
