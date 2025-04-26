
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
  detectDateConflicts
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
  dateCache,
  memoizeDateFn,
  batchProcessDates,
  DateOperationsCache
} from './dateOperationsCache';

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

// Export debugging utilities
export {
  debugDate as dateDebug,
  generateDateDebugReport
} from './dateDebugUtils';

// Export recurrence utilities
export {
  RecurrenceType,
  type RecurrenceRule,
  validateRecurrenceRule,
  generateOccurrences,
  formatRecurrenceRule,
  dateMatchesRecurrence
} from './recurringDatePatterns';
