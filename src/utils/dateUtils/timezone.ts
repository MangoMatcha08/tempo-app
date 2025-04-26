
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
 * @param date The date to convert
 * @param timeZone The target timezone (defaults to user's timezone)
 */
export function toZonedTime(date: Date, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Convert a date from a specific timezone to UTC
 * @param zonedDate The date in the specified timezone
 * @param timeZone The source timezone (defaults to 'UTC')
 */
export function fromZonedTime(zonedDate: Date, timeZone: string = 'UTC'): Date {
  const validDate = ensureValidDate(zonedDate);
  return new Date(formatInTimeZone(validDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Format a date with a specific timezone
 * Uses memoization for better performance
 * @param date The date to format
 * @param formatStr The format string (date-fns format)
 * @param timeZone The timezone to use (defaults to user's timezone)
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
  },
  // Cache for 5 minutes by default
  5 * 60 * 1000
);

// Explicit re-export for backward compatibility with date-fns-tz v2
// These exports help with migration from the old function names
export const utcToZonedTime = toZonedTime;
export const zonedTimeToUtc = fromZonedTime;
