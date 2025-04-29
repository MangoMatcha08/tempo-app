
/**
 * Date formatting utilities
 */
import { format } from 'date-fns';
import { ensureValidDate } from './validation';
import { DateFormats } from '../types';

/**
 * Formats a date according to the specified format string
 * 
 * @param date The date to format
 * @param formatStr The format pattern
 * @returns A formatted date string
 */
export function formatDate(date: Date | string | null | undefined, formatStr: string = DateFormats.ISO): string {
  try {
    const validDate = ensureValidDate(date);
    return format(validDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a date range as a string
 * 
 * @param startDate Range start date
 * @param endDate Range end date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  try {
    const start = ensureValidDate(startDate);
    const end = ensureValidDate(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return `${format(start, 'MMM d, yyyy')} ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    }
    
    return `${format(start, 'MMM d, yyyy h:mm a')} - ${format(end, 'MMM d, yyyy h:mm a')}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return '';
  }
}

/**
 * Formats a time string from a date
 * 
 * @param date The date to extract time from
 * @returns A formatted time string (e.g. "3:30 PM")
 */
export function formatTimeString(date: Date): string {
  return format(ensureValidDate(date), DateFormats.TIME);
}

/**
 * Creates a date with specific time components
 * 
 * @param date The base date
 * @param hours Hours (0-23)
 * @param minutes Minutes (0-59)
 * @returns New date with specified time
 */
export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  const validDate = new Date(date);
  validDate.setHours(hours, minutes, 0, 0);
  return validDate;
}
