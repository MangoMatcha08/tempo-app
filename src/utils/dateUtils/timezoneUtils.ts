
import { formatInTimeZone } from 'date-fns-tz';
import { ensureValidDate } from './core';

/**
 * Get the user's current timezone
 */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a date to a specific timezone
 */
export function toZonedTime(date: Date | string, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Convert a date from a specific timezone to UTC
 */
export function fromZonedTime(date: Date | string, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Format a date with timezone consideration
 */
export function formatWithTimeZone(
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss',
  timeZone: string = getUserTimeZone()
): string {
  try {
    const validDate = ensureValidDate(date);
    return formatInTimeZone(validDate, timeZone, formatStr);
  } catch (error) {
    console.error('Error formatting with timezone:', error);
    return '';
  }
}
