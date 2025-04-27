
import { Timestamp } from 'firebase/firestore';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Converts a Date or Timestamp to a standardized UTC Timestamp
 * Preserves original milliseconds
 */
export function toFirestoreDate(date: Date | Timestamp | null | undefined): Timestamp | null {
  if (!date) return null;
  
  try {
    if (date instanceof Timestamp) {
      return date;
    }
    
    // Preserve the original milliseconds
    return Timestamp.fromDate(date);
  } catch (error) {
    console.error('Error converting to Firestore date:', error);
    return null;
  }
}

/**
 * Converts a Firestore Timestamp to a local timezone Date
 * Preserves original milliseconds
 */
export function fromFirestoreDate(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    const utcDate = timestamp.toDate();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const localDate = new Date(utcDate);
    
    return localDate;
  } catch (error) {
    console.error('Error converting from Firestore date:', error);
    return null;
  }
}

