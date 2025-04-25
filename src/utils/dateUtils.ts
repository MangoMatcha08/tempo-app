
/**
 * Date utilities index file - exports all date-related functionality
 * 
 * This file serves as the main entry point for all date utilities in the application.
 * It organizes exports by functionality to make imports cleaner and more intuitive.
 */

// ==============================
// BASE DATE TRANSFORMATIONS
// ==============================
export {
  parseStringToDate,
  formatDate,
  compareDates,
  isDateInRange,
  formatWithTimezone,
  areDatesEqual
} from './dateTransformations';

// ==============================
// TIMEZONE & TIME UTILITIES
// ==============================
export {
  convertToUtc,
  convertToLocal,
  parseTimeString,
  parseTimeStringWithCompatibility,
  formatTimeString,
  formatDateRange,
  createDateWithTime,
  adjustDateIfPassed,
  parseFlexibleDateTime,
  logDateDetails
} from './dateTimeUtils';

// ==============================
// ENHANCED CONTEXT-AWARE UTILITIES
// ==============================
export {
  ensureValidDate,
  getUserTimeZone,
  formatDateWithPeriod,
  getRelativeTimeDisplay,
  getNearestPeriodTime,
  formatDisplayDate,
  toLocalTime,
  toUtcTime
} from './enhancedDateUtils';

// ==============================
// RECURRING PATTERN UTILITIES
// ==============================
export {
  RecurrenceType,
  DayOfWeek,
  type RecurrenceRule,
  validateRecurrenceRule,
  generateOccurrences,
  formatRecurrenceRule,
  dateMatchesRecurrence
} from './recurringDatePatterns';

// ==============================
// PERFORMANCE OPTIMIZATION
// ==============================
export {
  dateCache,
  memoizeDateFn,
  batchProcessDates,
  DateOperationsCache
} from './dateOperationsCache';

export {
  datePerformance,
  dateOptimizationTips
} from './datePerformanceMonitor';

// ==============================
// DATE VALIDATION & SECURITY
// ==============================
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

// ==============================
// FIREBASE TRANSFORMATIONS
// ==============================
export {
  toDate,
  isValidDate,
  getTimestamp,
  toFirestoreTimestamp,
  toISOString,
  logDateInfo
} from './dateTransformationUtils';

// Default export for backward compatibility
import { parseStringToDate, formatDate } from './dateTransformations';
export default {
  parseStringToDate,
  formatDate
};
