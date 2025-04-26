
import { formatInTimeZone } from 'date-fns-tz';
import { ensureValidDate } from './core';

export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function toZonedTime(date: Date, timeZone: string = getUserTimeZone()): Date {
  const validDate = ensureValidDate(date);
  return new Date(formatInTimeZone(validDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

export function fromZonedTime(zonedDate: Date, timeZone: string = 'UTC'): Date {
  const validDate = ensureValidDate(zonedDate);
  return new Date(formatInTimeZone(validDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX"));
}

export { formatWithTimeZone } from './formatting';
