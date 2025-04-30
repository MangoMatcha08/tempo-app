
import { Timestamp } from 'firebase/firestore';
import { toPSTTime, APP_TIMEZONE } from '@/utils/dateTimeUtils';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ensureValidDate } from '@/utils/dateUtils';

/**
 * Converts a Date or Timestamp to a standardized UTC Timestamp
 * Preserves original milliseconds but normalizes to UTC for storage
 */
export function toFirestoreDate(date: Date | Timestamp | null | undefined): Timestamp | null {
  if (!date) return null;
  
  try {
    if (date instanceof Timestamp) {
      return date;
    }
    
    // Convert to UTC before storing in Firestore
    const validDate = ensureValidDate(date);
    // Remove timezone influence by converting to UTC
    const utcDate = fromZonedTime(validDate, 'UTC');
    
    // Preserve the original milliseconds
    return Timestamp.fromDate(utcDate);
  } catch (error) {
    console.error('Error converting to Firestore date:', error);
    return null;
  }
}

/**
 * Converts a Firestore Timestamp to a PST timezone Date
 * All dates in the application should be in PST timezone
 */
export function fromFirestoreDate(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    // Get Date object from Timestamp (in UTC)
    const utcDate = timestamp.toDate();
    
    // Convert to PST timezone for consistency
    return toPSTTime(utcDate);
  } catch (error) {
    console.error('Error converting from Firestore date:', error);
    return null;
  }
}

/**
 * Formats a Firestore timestamp to a specific format string in PST timezone
 */
export function formatFirestoreDate(timestamp: Timestamp | null | undefined, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  if (!timestamp) return '';
  
  try {
    const pstDate = fromFirestoreDate(timestamp);
    if (!pstDate) return '';
    
    const { format } = require('date-fns');
    return format(pstDate, formatStr);
  } catch (error) {
    console.error('Error formatting Firestore date:', error);
    return '';
  }
}
