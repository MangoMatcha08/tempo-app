
import { format } from 'date-fns';
import { toZonedTime as dftToZonedTime, fromZonedTime as dftFromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { ensureValidDate } from './core';
import { memoizeDateFn } from '../dateMemoization';

export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export const toZonedTime = memoizeDateFn(
  'toZonedTime',
  (date: Date, timeZone: string = getUserTimeZone()): Date => {
    const validDate = ensureValidDate(date);
    return dftToZonedTime(validDate, timeZone);
  }
);

export const fromZonedTime = memoizeDateFn(
  'fromZonedTime',
  (zonedDate: Date, timeZone: string = 'UTC'): Date => {
    const validDate = ensureValidDate(zonedDate);
    return dftFromZonedTime(validDate, timeZone);
  }
);

export function formatWithTimeZone(
  date: Date | string,
  timeZone: string = getUserTimeZone(),
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  try {
    const validDate = ensureValidDate(date);
    return formatInTimeZone(validDate, timeZone, formatStr);
  } catch (error) {
    console.error('Error formatting with timezone:', error);
    return '';
  }
}

// Compatibility functions for legacy code
export const convertToUtc = fromZonedTime;
export const convertToLocal = toZonedTime;
