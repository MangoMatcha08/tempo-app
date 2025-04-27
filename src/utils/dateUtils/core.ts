
import { format } from 'date-fns';

/**
 * Type guard for Date objects
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Ensures a value is a valid Date object
 * Throws an error for invalid dates
 */
export function ensureValidDate(date: unknown): Date {
  if (date === null || date === undefined) {
    throw new Error('Invalid date input');
  }
  
  // Already a valid Date
  if (isDate(date)) {
    return date;
  }
  
  // Handle Firestore Timestamp objects
  if (typeof date === 'object' && date && 'toDate' in date && typeof date.toDate === 'function') {
    try {
      const converted = date.toDate();
      if (isDate(converted)) {
        return converted;
      }
    } catch {
      // Fall through to other methods
    }
  }
  
  // Try to parse string
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (isDate(parsed)) {
      return parsed;
    }
    throw new Error('Invalid date string');
  }
  
  // Try to handle numeric timestamp
  if (typeof date === 'number') {
    const parsed = new Date(date);
    if (isDate(parsed)) {
      return parsed;
    }
  }
  
  throw new Error(`Unable to convert to Date: ${String(date)}`);
}

/**
 * Time parsing interface
 */
export interface TimeComponents {
  hours: number;
  minutes: number;
}

/**
 * Validates if a time string is valid
 */
export function isTimeValid(timeStr: string): boolean {
  return !!parseTimeString(timeStr);
}

/**
 * Parses a time string to hours and minutes
 * Handles both 12h and 24h formats
 */
export function parseTimeString(timeStr: string): TimeComponents | null {
  // Handle 12-hour format (e.g., "3:00 PM")
  const amPmRegex = /^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)$/i;
  const amPmMatch = timeStr.match(amPmRegex);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = parseInt(amPmMatch[2], 10);
    const isPM = amPmMatch[3].toLowerCase() === 'pm';
    
    if (hours === 12) {
      hours = isPM ? 12 : 0;
    } else if (isPM) {
      hours += 12;
    }
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
    return null;
  }
  
  // Handle 24-hour format (e.g., "14:30")
  const hourMinuteRegex = /^(\d{1,2}):(\d{2})$/;
  const hourMinuteMatch = timeStr.match(hourMinuteRegex);
  if (hourMinuteMatch) {
    const hours = parseInt(hourMinuteMatch[1], 10);
    const minutes = parseInt(hourMinuteMatch[2], 10);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }
  
  return null;
}

/**
 * Parses object with hours/minutes properties to TimeComponents
 */
export function parseTimeComponents(value: unknown): TimeComponents | null {
  // Handle Date objects
  if (value instanceof Date && !isNaN(value.getTime())) {
    return {
      hours: value.getHours(),
      minutes: value.getMinutes()
    };
  }
  
  // Handle time string in format "HH:mm" or "H:mm"
  if (typeof value === 'string') {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return { hours, minutes };
      }
    }
  }
  
  // Handle object with hours/minutes properties
  if (value && typeof value === 'object' && 'hours' in value && 'minutes' in value) {
    const hours = Number(value.hours);
    const minutes = Number(value.minutes);
    
    if (!isNaN(hours) && !isNaN(minutes) &&
        hours >= 0 && hours < 24 && 
        minutes >= 0 && minutes < 60) {
      return { hours, minutes };
    }
  }
  
  return null;
}

/**
 * Checks if a value can be converted to a Date
 */
export function isConvertibleToDate(value: unknown): boolean {
  try {
    ensureValidDate(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a date with specific time components
 */
export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  const validDate = new Date(date);
  validDate.setHours(hours, minutes, 0, 0);
  return validDate;
}

/**
 * Safely logs date details for debugging
 */
export function logDateDetails(label: string, date: unknown): void {
  console.group(`Date Details: ${label}`);
  
  if (date === undefined) {
    console.log('Date is undefined');
  } else if (date === null) {
    console.log('Date is null');
  } else if (isDate(date)) {
    console.log('Is valid Date:', true);
    console.log('ISO string:', date.toISOString());
    console.log('Timestamp:', date.getTime());
    console.log('Local string:', date.toString());
  } else if (typeof date === 'object' && date && typeof date === 'object' && 
             'toDate' in date && typeof (date as any).toDate === 'function') {
    console.log('Is Firestore Timestamp:', true);
    try {
      const jsDate = (date as any).toDate();
      console.log('Converted to Date:', jsDate);
      if (jsDate instanceof Date) {
        console.log('ISO string:', jsDate.toISOString());
      }
    } catch (e) {
      console.error('Error converting to Date:', e);
    }
  } else {
    console.log('Type:', typeof date);
    console.log('Value:', date);
  }
  
  console.groupEnd();
}
