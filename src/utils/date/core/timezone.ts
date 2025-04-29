
/**
 * Timezone utilities for date handling
 */
import { formatInTimeZone } from 'date-fns-tz';
import { ensureValidDate, isDate } from './validation';

/**
 * Gets the user's current timezone from the browser
 */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Converts a date to a specific timezone
 * 
 * @param date The date to convert
 * @param timeZone The target timezone, defaults to user's local timezone
 * @returns A new Date instance in the target timezone
 */
export function toZonedTime(date: Date | string, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Converts a date from a specific timezone to local time
 * 
 * @param date The date to convert
 * @param timeZone The source timezone, defaults to user's local timezone
 * @returns A new Date instance in UTC
 */
export function fromZonedTime(date: Date | string, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

/**
 * Formats a date with timezone consideration
 * 
 * @param date The date to format
 * @param formatStr The format string
 * @param timeZone The timezone to use for formatting
 * @returns A formatted date string
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
