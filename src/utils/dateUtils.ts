
// Re-export everything from the new structure
export * from './dateUtils/index';

// Re-export core functionality
export {
  ensureValidDate,
  parseTimeString,
  createDateWithTime,
  logDateDetails
} from './dateUtils/core';

// Re-export timezone utilities
export {
  toZonedTime,
  fromZonedTime,
  formatWithTimeZone,
  getUserTimeZone
} from './dateUtils/timezoneUtils';

// Re-export validation utilities
export {
  validateDate,
  validateDateRange,
  DateValidationErrorType
} from './dateUtils/validation';

// Re-export formatting
export {
  formatDate,
  formatDateRange,
  formatTimeString
} from './dateUtils/formatting';

// Re-export transformations
export {
  parseStringToDate,
  isDateInRange,
  areDatesEqual,
  convertToUtc,
  convertToLocal
} from './dateUtils/transformation';

// Re-export adjustment
export {
  adjustDateIfPassed,
  debugDate
} from './dateUtils/adjustment';
