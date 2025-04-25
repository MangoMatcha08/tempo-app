
/**
 * Date utilities index file - exports all date-related functionality
 */

// Base date transformations
export {
  parseStringToDate,
  formatDate,
  formatWithTimezone,
  compareDates,
  isDateInRange,
  areDatesEqual,
  toUtcTime,
  toLocalTime,
  ensureValidDate
} from './dateTransformations';

// Time utilities
export {
  parseTimeString,
  createDateWithTime,
  adjustDateIfPassed,
  formatTimeString,
  formatDateRange
} from './dateTimeUtils';

// Enhanced date utilities
export {
  getUserTimeZone,
  formatDateWithPeriod,
  getRelativeTimeDisplay,
  getNearestPeriodTime
} from './enhancedDateUtils';

// Recurring patterns
export {
  RecurrenceType,
  DayOfWeek,
  type RecurrenceRule,
  validateRecurrenceRule,
  generateOccurrences,
  formatRecurrenceRule,
  dateMatchesRecurrence
} from './recurringDatePatterns';

// Date validation
export {
  validateDate,
  validateDateRange,
  sanitizeDate,
  getEarliestValidDate,
  DateFormats,
  DateValidationErrorType,
  type DateValidationOptions,
  type DateValidationResult
} from './dateValidation';

// Performance monitoring
export { datePerformance } from './datePerformanceMonitor';

