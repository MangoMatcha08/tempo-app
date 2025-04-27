
import { formatInTimeZone } from 'date-fns-tz';
import { ensureValidDate } from './core';
import { memoizeDateFn } from '../dateMemoization';

/**
 * Get the user's current timezone
 */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a date to a specific timezone
 */
export function toZonedTime(date: Date, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Convert a date from a specific timezone to UTC
 */
export function fromZonedTime(zonedDate: Date, timeZone: string = 'UTC'): Date {
  const validDate = ensureValidDate(zonedDate);
  return new Date(formatInTimeZone(validDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Format a date with a specific timezone
 */
export const formatWithTimeZone = memoizeDateFn(
  'formatWithTimeZone',
  (date: Date | string, formatStr: string = 'yyyy-MM-dd HH:mm:ss', timeZone: string = getUserTimeZone()): string => {
    try {
      const validDate = ensureValidDate(date);
      return formatInTimeZone(validDate, timeZone, formatStr);
    } catch (error) {
      console.error('Error formatting with timezone:', error);
      return '';
    }
  }
);
