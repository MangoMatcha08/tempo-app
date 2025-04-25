
import { validateDate } from './validation';

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

export function createDateWithTime(
  baseDate: Date | string | null | undefined,
  hours: number,
  minutes: number
): Date | null {
  const validation = validateDate(baseDate);
  
  if (!validation.isValid || !validation.sanitizedValue) {
    return null;
  }
  
  const result = new Date(validation.sanitizedValue);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
