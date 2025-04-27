import { ensureValidDate } from './dateUtils';
import { toZonedTime, fromZonedTime } from './dateUtils/timezone';
import { adjustDateIfPassed } from './dateUtils/adjustment';
import type { TimeComponents } from './dateUtils/types';
import { parseTimeString } from './dateUtils/core';

// Re-export parseTimeString
export { parseTimeString, adjustDateIfPassed };

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
 * Adjust date if it's in the past (used for reminders)
 */
export { adjustDateIfPassed };

/**
 * Safe conversion to local time
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
 * Safe conversion to UTC
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

/**
 * Log date details for debugging
 */
export function logDateDetails(label: string, date: unknown): void {
  console.group(`[${label}]`);
  try {
    const validDate = ensureValidDate(date);
    console.log({
      date: validDate.toString(),
      iso: validDate.toISOString(),
      time: validDate.toLocaleTimeString(),
      timestamp: validDate.getTime(),
      isValid: isDate(validDate),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    console.error('Invalid date:', date);
    console.error('Error:', error);
  }
  console.groupEnd();
}

// Re-export timezone conversion functions with new names for backward compatibility
export { toZonedTime, fromZonedTime };

// Provide legacy function names for backward compatibility
export const convertToUtc = fromZonedTime;
export const convertToLocal = toZonedTime;

// Export the centralized functions for direct use
export { toZonedTime as convertToZonedTime } from './dateUtils/timezone';
export { fromZonedTime as convertFromZonedTime } from './dateUtils/timezone';
