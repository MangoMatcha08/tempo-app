
import { ensureValidDate } from './dateUtils';
import { toZonedTime, fromZonedTime } from './dateUtils/timezone';
import type { TimeComponents } from './dateUtils/types';
import { parseTimeString } from './dateUtils/core';

// Re-export core utilities
export { parseTimeString };

/**
 * Type guard to check if value is a valid Date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard to check if value can be converted to a valid Date
 */
export function isConvertibleToDate(value: unknown): boolean {
  try {
    const date = ensureValidDate(value);
    return isDate(date);
  } catch {
    return false;
  }
}

/**
 * Create a date with specific time components
 */
export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  try {
    const validDate = ensureValidDate(date);
    const newDate = new Date(validDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  } catch (error) {
    console.error('Error creating date with time:', error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Safe conversion to local time with timezone handling
 */
export function toLocalTime(date: unknown): Date {
  try {
    const validDate = ensureValidDate(date);
    return toZonedTime(validDate);
  } catch (error) {
    console.error('Error converting to local time:', error);
    return new Date();
  }
}

/**
 * Safe conversion to UTC with timezone handling
 */
export function toUtcTime(date: unknown): Date {
  try {
    const validDate = ensureValidDate(date);
    return fromZonedTime(validDate);
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return new Date();
  }
}

/**
 * Parse time components safely
 */
export function parseTimeComponents(date: unknown): TimeComponents | null {
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

// Re-export timezone functions with consistent naming
export { toZonedTime, fromZonedTime };

// Legacy names for backward compatibility
export const convertToUtc = fromZonedTime;
export const convertToLocal = toZonedTime;
