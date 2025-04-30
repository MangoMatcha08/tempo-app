
import { format, parse, isValid } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Core date utilities that serve as the foundation for all date operations
 */

export function ensureValidDate(date: any): Date {
  // Already a valid Date
  if (typeof date === 'object' && Object.prototype.toString.call(date) === '[object Date]' && !isNaN((date as Date).getTime())) {
    return date as Date;
  }
  
  // Firebase Timestamp
  if (date && typeof date === 'object' && 'toDate' in date) {
    try {
      return date.toDate();
    } catch (err) {
      console.warn('Invalid Timestamp object:', err);
      throw new Error('Invalid Timestamp object');
    }
  }
  
  // String handling
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    throw new Error('Invalid date string');
  }
  
  // Default fallback
  console.warn('Invalid date input, using current date:', date);
  throw new Error('Invalid date input');
}

/**
 * Converts a date to UTC timezone representation
 * Consistent naming: toUtc
 */
export function toUtc(date: Date): Date {
  const validDate = ensureValidDate(date);
  return fromZonedTime(validDate, 'UTC');
}

/**
 * Converts a date to local timezone representation
 * Consistent naming: toLocal
 */
export function toLocal(date: Date): Date {
  const validDate = ensureValidDate(date);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return toZonedTime(validDate, timeZone);
}

// Legacy function names for compatibility
export const convertToUtc = toUtc;
export const convertToLocal = toLocal;

export function debugDate(label: string, date: any): void {
  console.group(`Debug Info: ${label}`);
  try {
    const validDate = ensureValidDate(date);
    console.log('Date object:', validDate);
    console.log('ISO string:', validDate.toISOString());
    console.log('Local string:', validDate.toString());
    console.log('Formatted:', format(validDate, 'PPPppp'));
    console.log('Timestamp:', validDate.getTime());
    console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch (error) {
    console.error('Error debugging date:', error);
    console.log('Original value:', date);
  }
  console.groupEnd();
}

export function isTimeValid(hours: number, minutes: number): boolean {
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

export function isDateValid(value: any): boolean {
  if (!value) return false;
  try {
    const date = ensureValidDate(value);
    return isValid(date);
  } catch {
    return false;
  }
}

export interface TimeComponents {
  hours: number;
  minutes: number;
}

export function parseTimeString(timeStr: string): TimeComponents | null {
  if (!timeStr) {
    return null;
  }
  
  try {
    const timeRegex = /(\d{1,2})(?::(\d{1,2}))?\s*([AP]M)?/i;
    const match = timeStr.match(timeRegex);
    
    if (!match) {
      return null;
    }
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3]?.toUpperCase();
    
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    
    return { hours, minutes };
  } catch {
    return null;
  }
}
