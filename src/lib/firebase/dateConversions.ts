
import { Timestamp } from 'firebase/firestore';
import { toPSTTime, APP_TIMEZONE } from '@/utils/dateTimeUtils';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ensureValidDate } from '@/utils/dateUtils';

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
    
    // Convert to UTC before storing in Firestore
    const validDate = ensureValidDate(date);
    // Remove timezone influence by converting to UTC
    const utcDate = fromZonedTime(validDate, 'UTC');
    
    // Preserve the original milliseconds
    return Timestamp.fromDate(utcDate);
  } catch (error) {
    console.error('Error converting to Firestore timestamp:', error);
    return null;
  }
}

/**
 * Converts a Firestore Timestamp to a PST timezone Date
 * All dates in the application should be in PST timezone
 * Consistent naming: fromFirestoreTimestamp
 */
export function fromFirestoreTimestamp(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    // Check if it's a valid Timestamp
    if (!(timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function')) {
      return null;
    }
    
    // Get Date object from Timestamp (in UTC)
    const utcDate = timestamp.toDate();
    
    // Convert to PST timezone for consistency
    return toPSTTime(utcDate);
  } catch (error) {
    console.error('Error converting from Firestore timestamp:', error);
    return null;
  }
}

/**
 * Formats a Firestore timestamp to a specific format string in PST timezone
 */
export function formatFirestoreDate(timestamp: Timestamp | null | undefined, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  if (!timestamp) return '';
  
  try {
    const pstDate = fromFirestoreTimestamp(timestamp);
    if (!pstDate) return '';
    
    const { format } = require('date-fns');
    return format(pstDate, formatStr);
  } catch (error) {
    console.error('Error formatting Firestore date:', error);
    return '';
  }
}

// Legacy function names for compatibility
export const toFirestoreDate = toFirestoreTimestamp;
export const fromFirestoreDate = fromFirestoreTimestamp;
