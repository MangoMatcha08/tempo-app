
import { format, parse, isValid, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';
import { ensureValidDate } from './enhancedDateUtils';
import { parseStringToDate, formatWithTimezone } from './dateTransformations';

/**
 * Parse time string (e.g., "3:00 PM")
 */
export const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  if (!timeStr) {
    console.warn('Invalid time string:', timeStr);
    return { hours: 0, minutes: 0 };
  }
  
  try {
    // Handle various time formats
    // Format: "3:00 PM", "15:00", "3PM", etc.
    const timeRegex = /(\d{1,2})(?::(\d{1,2}))?(?:\s*([AP]M))?/i;
    const match = timeStr.match(timeRegex);
    
    if (!match) {
      console.warn('Time string does not match expected format:', timeStr);
      return { hours: 0, minutes: 0 };
    }
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3]?.toUpperCase();
    
    // Handle 12-hour format
    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
    
    console.log(`Parsed time ${timeStr} to ${hours}:${minutes}`);
    return { hours, minutes };
  } catch (error) {
    console.error('Error parsing time string:', timeStr, error);
    return { hours: 0, minutes: 0 };
  }
};

/**
 * Create a date with specific time components
 */
export const createDateWithTime = (
  baseDate: Date,
  hours: number,
  minutes: number
): Date => {
  const validDate = ensureValidDate(baseDate);
  const result = new Date(validDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

/**
 * Check if a date needs to be moved to tomorrow
 * This is used when a time is in the past
 */
export const adjustDateIfPassed = (date: Date): Date => {
  const now = new Date();
  const adjustedDate = new Date(date);
  
  if (adjustedDate < now) {
    // Add a day
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    console.log('Date has passed, adjusting to tomorrow:', adjustedDate);
  }
  
  return adjustedDate;
};

/**
 * Parse a date-time string into a Date object
 * with flexible format handling
 */
export const parseFlexibleDateTime = (dateTimeStr: string): Date | null => {
  if (!dateTimeStr) return null;
  
  try {
    // Try using our enhanced parser first
    const parsed = parseStringToDate(dateTimeStr);
    if (parsed) return parsed;
    
    // Fallback to native Date
    const nativeDate = new Date(dateTimeStr);
    if (isValid(nativeDate)) return nativeDate;
    
    console.warn('Failed to parse date string:', dateTimeStr);
    return null;
  } catch (error) {
    console.error('Error parsing date-time string:', error);
    return null;
  }
};

/**
 * Format a date into a time string (e.g., "3:00 PM")
 */
export const formatTimeString = (date: Date): string => {
  const validDate = ensureValidDate(date);
  return format(validDate, 'h:mm a');
};

/**
 * Format a date range as a string (e.g., "Jan 1, 2025 - Jan 5, 2025")
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = ensureValidDate(startDate);
  const end = ensureValidDate(endDate);
  
  // If same day, only show date once
  if (start.toDateString() === end.toDateString()) {
    return `${format(start, 'MMM d, yyyy')} ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  }
  
  // Different days
  return `${format(start, 'MMM d, yyyy h:mm a')} - ${format(end, 'MMM d, yyyy h:mm a')}`;
};

/**
 * Log date details for debugging
 */
export const logDateDetails = (label: string, date: Date | unknown): void => {
  try {
    if (!date) {
      console.log(`${label}: null or undefined`);
      return;
    }
    
    const validDate = date instanceof Date ? date : new Date(date as any);
    
    if (isValid(validDate)) {
      console.log(`${label}:`, {
        isoString: validDate.toISOString(),
        localString: validDate.toString(),
        formatted: formatWithTimezone(validDate),
        timestamp: validDate.getTime(),
        year: validDate.getFullYear(),
        month: validDate.getMonth() + 1,
        day: validDate.getDate(),
        hours: validDate.getHours(),
        minutes: validDate.getMinutes()
      });
    } else {
      console.log(`${label}: Invalid date`, date);
    }
  } catch (error) {
    console.error(`Error logging date (${label}):`, error);
    console.log(`${label} original value:`, date);
  }
};
