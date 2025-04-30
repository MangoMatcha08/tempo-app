
import { Timestamp } from 'firebase/firestore';
import { toFirestoreTimestamp, fromFirestoreTimestamp, formatFirestoreDate } from './dateConversions';
import { toPSTTime, APP_TIMEZONE } from '@/utils/dateTimeUtils';
import { ensureValidDate } from '@/utils/dateUtils';
import { formatWithTimeZone } from '@/utils/dateUtils/timezone';

/**
 * Firebase Date Utility functions for consistent handling of
 * dates between Firestore and our PST-standardized application
 */

/**
 * Converts a Date to a Firestore Timestamp with UTC normalization
 */
export const dateToTimestamp = toFirestoreTimestamp;

/**
 * Converts a Firestore Timestamp to a PST Date
 */
export const timestampToDate = fromFirestoreTimestamp;

/**
 * Formats a Firestore timestamp directly to a string
 */
export const formatTimestamp = formatFirestoreDate;

/**
 * Validates and normalizes document data with timestamps for consistent timezone handling
 * This is particularly useful when handling data from Firestore
 */
export const normalizeDocumentDates = <T extends Record<string, any>>(
  doc: T, 
  dateFields: string[] = ['createdAt', 'updatedAt', 'dueDate', 'completedAt']
): T => {
  if (!doc) return doc;
  
  const result = { ...doc } as T;
  
  for (const field of dateFields) {
    const value = result[field as keyof T];
    if (value) {
      // Use type assertions to safely check instance types
      if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        // Convert Firestore Timestamp to PST Date
        (result as any)[field] = timestampToDate(value as Timestamp);
      } else if (value instanceof Date || typeof value === 'string') {
        // Ensure any existing Date is in PST timezone
        (result as any)[field] = toPSTTime(ensureValidDate(value));
      }
    }
  }
  
  return result;
};

/**
 * Formats a Firestore date field with period information
 */
export const formatFirestoreDateWithPeriod = (
  doc: Record<string, any>,
  dateField: string = 'dueDate',
  periodIdField: string = 'periodId',
  periodNameGetter?: (periodId: string) => string | undefined
): string => {
  try {
    const date = doc[dateField];
    const periodId = doc[periodIdField];
    
    if (!date) return '';
    
    let formattedDate: Date;
    
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      formattedDate = timestampToDate(date as Timestamp) as Date;
    } else {
      formattedDate = toPSTTime(ensureValidDate(date));
    }
    
    // Format time in PST
    const timeStr = formatWithTimeZone(formattedDate, 'h:mm a', APP_TIMEZONE);
    
    // Add period name if available
    if (periodId && periodNameGetter) {
      const periodName = periodNameGetter(periodId);
      if (periodName) {
        return `${timeStr} (${periodName})`;
      }
    }
    
    return timeStr;
  } catch (error) {
    console.error('Error formatting Firestore date with period:', error);
    return '';
  }
};
