
// Core date utilities
export {
  isDate,
  ensureValidDate,
  isTimeValid,
  parseTimeString,
  formatTimeString
} from './core';

// Timezone utilities
export {
  toZonedTime,
  fromZonedTime,
  getUserTimeZone,
  formatWithTimeZone,
  convertToUtc,
  convertToLocal
} from './timezoneUtils';

// Re-export types
export type {
  TimeComponents,
  DateValidationError,
  DateValidationResult,
  DateValidationOptions
} from './types';

// Re-export enums and constants
export {
  DateFormats,
  DateValidationErrorType,
  ValidationErrorMessages
} from './types';

// Date operations from dateTimeUtils (moved here)
export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  const validDate = ensureValidDate(date);
  const newDate = new Date(validDate);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

export function parseTimeComponents(date: Date): { hours: number; minutes: number } | null {
  try {
    const validDate = ensureValidDate(date);
    return {
      hours: validDate.getHours(),
      minutes: validDate.getMinutes()
    };
  } catch {
    return null;
  }
}

// Re-export validation functions
export {
  validateDate,
  validateDateRange
} from './validation';
