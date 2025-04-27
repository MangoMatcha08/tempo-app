
import { formatInTimeZone } from 'date-fns-tz';
import { ensureValidDate } from './core';

export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function toZonedTime(date: Date | string, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

export function fromZonedTime(date: Date | string, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

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
