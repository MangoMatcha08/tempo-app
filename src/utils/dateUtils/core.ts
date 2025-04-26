import { isValid } from 'date-fns';
import type { TimeComponents } from './types';

export function ensureValidDate(date: any): Date {
  // Already a valid Date
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  // Firebase Timestamp handling
  if (date && typeof date === 'object' && 'toDate' in date) {
    try {
      const converted = date.toDate();
      if (converted instanceof Date && !isNaN(converted.getTime())) {
        return converted;
      }
    } catch (err) {
      throw new Error('Invalid Timestamp object');
    }
  }
  
  // String handling
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    throw new Error('Invalid date string');
  }
  
  // Numeric timestamp handling
  if (typeof date === 'number' && !isNaN(date)) {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  throw new Error('Invalid date input');
}

export function isTimeValid(hours: number, minutes: number): boolean {
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

export function isDateValid(value: any): boolean {
  if (!value) return false;
  const date = ensureValidDate(value);
  return isValid(date);
}

export function parseTimeString(timeStr: string): TimeComponents | null {
  if (!timeStr) return null;
  
  try {
    const timeRegex = /(\d{1,2})(?::(\d{1,2}))?\s*([AP]M)?/i;
    const match = timeStr.match(timeRegex);
    
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3]?.toUpperCase();
    
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    
    if (!isTimeValid(hours, minutes)) return null;
    
    return { hours, minutes };
  } catch {
    return null;
  }
}

export function formatTimeString(date: Date | string): string {
  try {
    const validDate = ensureValidDate(date);
    return validDate.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '--:--';
  }
}
