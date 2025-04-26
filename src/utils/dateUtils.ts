
// Re-export core utilities
export {
  ensureValidDate,
  convertToUtc,
  convertToLocal,
  debugDate,
  isTimeValid,
  isDateValid
} from './dateCore';

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
export {
  findAvailableTimeSlots,
  suggestIdealPeriods,
  suggestDueDates,
  detectDateConflicts,
  TimeSlot
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

// Export performance utilities
export {
  datePerformance,
  dateOptimizationTips
} from './datePerformanceMonitor';

// Export validation utilities
export {
  validateDate,
  validateDateRange,
  sanitizeDate,
  DateFormats,
  DateValidationErrorType,
  type DateValidationOptions,
  type DateValidationResult
} from './dateValidation';

// Export recurrence utilities
export {
  RecurrenceType,
  type RecurrenceRule,
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

