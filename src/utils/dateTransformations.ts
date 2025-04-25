
import { format, isValid, parse, compareAsc, isAfter, isBefore } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { Timestamp } from "firebase/firestore";
import { isTimestamp } from './typeGuards';

/**
 * Parse string to Date object
 */
export function parseStringToDate(dateStr: string): Date | null {
  try {
    const parsed = new Date(dateStr);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Format date to string with timezone consideration
 */
export function formatWithTimezone(
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss',
  timeZone?: string
): string {
  try {
    const validDate = date instanceof Date ? date : new Date(date);
    if (!isValid(validDate)) return '';

    if (timeZone) {
      const zonedDate = toZonedTime(validDate, timeZone);
      return format(zonedDate, formatStr);
    }
    
    return format(validDate, formatStr);
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return '';
  }
}

/**
 * Basic date formatting
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd'
): string {
  try {
    const validDate = date instanceof Date ? date : new Date(date);
    return isValid(validDate) ? format(validDate, formatStr) : '';
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Compare two dates
 */
export function compareDates(date1: Date, date2: Date): number {
  return compareAsc(date1, date2);
}

/**
 * Check if date is in range
 */
export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date
): boolean {
  return !isBefore(date, startDate) && !isAfter(date, endDate);
}

/**
 * Check if two dates are equal (ignoring milliseconds)
 */
export function areDatesEqual(date1: Date | string, date2: Date | string): boolean {
  try {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate() &&
           d1.getHours() === d2.getHours() &&
           d1.getMinutes() === d2.getMinutes() &&
           d1.getSeconds() === d2.getSeconds();
  } catch {
    return false;
  }
}

/**
 * Convert to UTC time
 */
export function toUtcTime(date: Date): Date {
  return fromZonedTime(date, 'UTC');
}

/**
 * Convert to local time
 */
export function toLocalTime(date: Date): Date {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return toZonedTime(date, timeZone);
}

/**
 * Ensure a value is a valid Date object
 */
export function ensureValidDate(value: any): Date {
  // Handle Timestamp objects
  if (isTimestamp(value)) {
    return value.toDate();
  }
  
  // Handle valid Date objects
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  // Handle ISO strings
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Handle numeric timestamps
  if (typeof value === 'number' && !isNaN(value)) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  console.warn('Invalid date value encountered:', value);
  return new Date();
}

