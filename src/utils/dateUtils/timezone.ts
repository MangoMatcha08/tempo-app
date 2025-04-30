
import { formatInTimeZone } from 'date-fns-tz';
import { ensureValidDate } from './core';
import { APP_TIMEZONE } from '../dateTimeUtils';

// Always return the app timezone (PST)
export function getUserTimeZone(): string {
  return APP_TIMEZONE;
}

// Convert to PST time by default
export function toZonedTime(date: Date | string, timeZone: string = APP_TIMEZONE): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

// Convert from PST time by default
export function fromZonedTime(date: Date | string, timeZone: string = APP_TIMEZONE): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

// Format with PST timezone by default
export function formatWithTimeZone(
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss',
  timeZone: string = APP_TIMEZONE
): string {
  try {
    const validDate = ensureValidDate(date);
    return formatInTimeZone(validDate, timeZone, formatStr);
  } catch (error) {
    console.error('Error formatting with timezone:', error);
    return '';
  }
}
