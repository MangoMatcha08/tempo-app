
import { isValid } from 'date-fns';

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function ensureValidDate(date: Date | string | number | null | undefined): Date {
  // Already a valid Date
  if (isDate(date)) {
    return date;
  }
  
  try {
    // Handle string input
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isDate(parsed)) {
        return parsed;
      }
      throw new Error('Invalid date string');
    }
    
    // Handle numeric timestamp
    if (typeof date === 'number' && !isNaN(date)) {
      const parsed = new Date(date);
      if (isDate(parsed)) {
        return parsed;
      }
    }
    
    throw new Error('Invalid date input');
  } catch (error) {
    throw error instanceof Error ? error : new Error('Invalid date input');
  }
}

export function isTimeValid(hours: number, minutes: number): boolean {
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
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

export function parseTimeComponents(date: Date): { hours: number; minutes: number } | null {
  if (!isDate(date)) return null;
  
  return {
    hours: date.getHours(),
    minutes: date.getMinutes()
  };
}

export function isConvertibleToDate(value: any): boolean {
  try {
    const date = ensureValidDate(value);
    return isValid(date);
  } catch {
    return false;
  }
}

export function logDateDetails(label: string, date: Date): void {
  console.group(label);
  console.log('Date:', date);
  console.log('ISO:', date.toISOString());
  console.log('Local:', date.toString());
  console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.groupEnd();
}
