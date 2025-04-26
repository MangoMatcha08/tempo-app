
import { format } from 'date-fns';
import { ensureValidDate } from './core';
import { formatInTimeZone } from 'date-fns-tz';
import { formatWithTimeZone as formatWithTz, getUserTimeZone } from './timezone';

export function formatDate(date: Date | string | null | undefined, formatStr: string = 'yyyy-MM-dd'): string {
  try {
    const validDate = ensureValidDate(date);
    return format(validDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

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

// Re-export the centralized formatWithTimeZone function
export const formatWithTimeZone = formatWithTz;
