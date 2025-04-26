
import { format, parse, isValid as isDateValid } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Core date utilities that serve as the foundation for all date operations
 */

export function ensureValidDate(date: any): Date {
  // Already a valid Date
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  // Firebase Timestamp
  if (date && typeof date === 'object' && 'toDate' in date) {
    try {
      return date.toDate();
    } catch (err) {
      console.warn('Invalid Timestamp object:', err);
    }
  }
  
  // String handling
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  
  // Default fallback
  console.warn('Invalid date input, using current date:', date);
  return new Date();
}

export function convertToUtc(date: Date): Date {
  const validDate = ensureValidDate(date);
  return fromZonedTime(validDate, 'UTC');
}

export function convertToLocal(date: Date): Date {
  const validDate = ensureValidDate(date);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return toZonedTime(validDate, timeZone);
}

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

export function isDateValid(date: any): boolean {
  if (!date) return false;
  const validDate = ensureValidDate(date);
  return isDateValid(validDate);
}
