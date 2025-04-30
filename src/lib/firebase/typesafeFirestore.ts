
import { Timestamp, DocumentData } from 'firebase/firestore';
import { toFirestoreTimestamp, fromFirestoreTimestamp } from './dateConversions';

/**
 * Type-safe utility to convert date fields in a document
 * Ensures proper type handling without TypeScript errors
 */
export function convertDatesToTimestamps<T extends Record<string, any>>(
  document: T,
  dateFields: Array<keyof T>
): Record<string, any> {
  if (!document) return document;
  
  const result = { ...document };
  
  for (const field of dateFields) {
    const value = document[field];
    if (value instanceof Date) {
      result[field as string] = toFirestoreTimestamp(value);
    } else if (typeof value === 'string') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          result[field as string] = toFirestoreTimestamp(date);
        }
      } catch (error) {
        console.warn(`Failed to convert string to date for field: ${String(field)}`, error);
      }
    }
  }
  
  return result;
}

/**
 * Type-safe utility to convert timestamps in a Firebase document to dates
 */
export function convertTimestampsToDate<T extends Record<string, any>>(
  document: DocumentData
): Record<string, any> {
  if (!document) return document;
  
  const result = { ...document };
  
  for (const key in result) {
    const value = result[key];
    if (value instanceof Timestamp) {
      result[key] = fromFirestoreTimestamp(value);
    }
  }
  
  return result;
}

/**
 * Creates a typed document with proper date field handling
 */
export function createTypedDocument<T>(
  data: DocumentData, 
  id: string, 
  dateFieldConverter?: (doc: Record<string, any>) => Record<string, any>
): T {
  const baseDoc = {
    id,
    ...data
  };
  
  const processedDoc = dateFieldConverter 
    ? dateFieldConverter(baseDoc) 
    : convertTimestampsToDate(baseDoc);
    
  return processedDoc as T;
}
