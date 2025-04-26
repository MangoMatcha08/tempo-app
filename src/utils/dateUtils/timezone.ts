
import { toZonedTime as dftToZonedTime, fromZonedTime as dftFromZonedTime } from 'date-fns-tz';
import { ensureValidDate } from './core';

export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function toZonedTime(date: Date, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return dftToZonedTime(validDate, timeZone);
}

export function fromZonedTime(zonedDate: Date, timeZone: string = 'UTC'): Date {
  const validDate = ensureValidDate(zonedDate);
  return dftFromZonedTime(validDate, timeZone);
}

// Export formatWithTimeZone with consistent naming
export { formatWithTimeZone } from './formatting';
