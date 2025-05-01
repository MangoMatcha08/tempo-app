
import { Timestamp } from 'firebase/firestore';
import { toPSTTime, APP_TIMEZONE } from '@/utils/dateTimeUtils';
import { format } from 'date-fns';

/**
 * Converts a Date or Timestamp to a standardized UTC Timestamp
 * Preserves original milliseconds but normalizes to UTC for storage
 * Consistent naming: toFirestoreTimestamp
 */
export function toFirestoreTimestamp(date: Date | Timestamp | null | undefined): Timestamp | null {
  if (!date) return null;
  
  try {
    // Check if it's already a Timestamp
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return date as Timestamp;
    }
    
    // Convert Date to Timestamp
    return Timestamp.fromDate(date as Date);
  } catch (error) {
    console.error('Error converting to Firestore timestamp:', error);
    return null;
  }
}

/**
 * Converts a Firestore Timestamp to a Date
 * Consistent naming: fromFirestoreTimestamp
 */
export function fromFirestoreTimestamp(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    // Check if it's a valid Timestamp
    if (!(timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function')) {
      return null;
    }
    
    // Get Date object from Timestamp
    return timestamp.toDate();
  } catch (error) {
    console.error('Error converting from Firestore timestamp:', error);
    return null;
  }
}

/**
 * Formats a Firestore timestamp to a specific format string
 */
export function formatFirestoreDate(timestamp: Timestamp | null | undefined, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  if (!timestamp) return '';
  
  try {
    const date = fromFirestoreTimestamp(timestamp);
    if (!date) return '';
    
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting Firestore date:', error);
    return '';
  }
}

/**
 * Formats a date from a reminder object with period information if available
 * This is a browser-compatible implementation that doesn't use require
 */
export function formatFirestoreDateWithPeriod(
  reminder: any, 
  dateField: string = 'dueDate',
  periodIdField: string = 'periodId',
  getPeriodNameFn?: (id: string) => string
): string {
  try {
    // Get the date from the reminder
    const date = reminder[dateField];
    if (!date) return '';
    
    // Format the time in 12-hour format
    const timeStr = date instanceof Date 
      ? date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true,
          timeZone: APP_TIMEZONE
        })
      : '';
    
    // If no period ID or no function to get period name, just return the time
    const periodId = reminder[periodIdField];
    if (!periodId || !getPeriodNameFn) return timeStr;
    
    // Get the period name and combine with time
    const periodName = getPeriodNameFn(periodId);
    return periodName ? `${timeStr} (${periodName})` : timeStr;
  } catch (error) {
    console.error('Error formatting Firestore date with period:', error);
    return '';
  }
}

// Legacy function names for compatibility
export const toFirestoreDate = toFirestoreTimestamp;
export const fromFirestoreDate = fromFirestoreTimestamp;
