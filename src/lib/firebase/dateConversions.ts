
import { Timestamp } from 'firebase/firestore';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Converts a Date or Timestamp to a standardized UTC Date object
 */
export function toFirestoreDate(date: Date | Timestamp | null | undefined): Timestamp | null {
  if (!date) return null;
  
  try {
    if (date instanceof Timestamp) {
      return date;
    }
    
    const utcDate = new Date(
      formatInTimeZone(date, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX")
    );
    
    return Timestamp.fromDate(utcDate);
  } catch (error) {
    console.error('Error converting to Firestore date:', error);
    return null;
  }
}

/**
 * Converts a Firestore Timestamp to a local timezone Date
 */
export function fromFirestoreDate(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    const utcDate = timestamp.toDate();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const localDate = new Date(
      formatInTimeZone(utcDate, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX")
    );
    
    return localDate;
  } catch (error) {
    console.error('Error converting from Firestore date:', error);
    return null;
  }
}

