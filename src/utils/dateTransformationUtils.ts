
import { Timestamp } from "firebase/firestore";

/**
 * Date Transformation Utilities
 * 
 * This file contains utilities for transforming date objects between various formats:
 * - Firebase Timestamp objects
 * - JavaScript Date objects
 * - ISO strings
 * 
 * It provides consistent date handling throughout the application.
 */

/**
 * Converts any date-like value to a JavaScript Date
 */
export function toDate(value: any): Date {
  // Already a valid Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  // Firebase Timestamp
  if (value && typeof value === 'object' && 'toDate' in value) {
    return value.toDate();
  }
  
  // ISO String or any string parsable as date
  if (typeof value === 'string') {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  
  // Unix timestamp (number)
  if (typeof value === 'number' && !isNaN(value)) {
    return new Date(value);
  }
  
  // Default fallback
  console.warn('Invalid date format encountered, using current date:', value);
  return new Date();
}

/**
 * Checks if a value is a valid date
 */
export function isValidDate(value: any): boolean {
  if (!value) return false;
  
  // Check if it's a Date object with a valid time
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  
  // Check if it's a Firestore timestamp
  if (typeof value === 'object' && value && typeof value.toDate === 'function') {
    try {
      const date = value.toDate();
      return date instanceof Date && !isNaN(date.getTime());
    } catch (e) {
      return false;
    }
  }
  
  // Check if it's a valid ISO string
  if (typeof value === 'string') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  // Check if it's a valid number
  if (typeof value === 'number') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  return false;
}

/**
 * Safely gets the timestamp from a date value
 */
export function getTimestamp(value: any): number {
  try {
    const date = toDate(value);
    return date.getTime();
  } catch (error) {
    console.error('Failed to get timestamp from value:', value, error);
    return Date.now(); // Fallback to current time
  }
}

/**
 * Converts a JavaScript Date to a Firebase Timestamp
 */
export function toFirestoreTimestamp(date: Date | any): Timestamp {
  const validDate = toDate(date);
  return Timestamp.fromDate(validDate);
}

/**
 * Formats a date to ISO string with validation
 */
export function toISOString(date: Date | any): string {
  try {
    const validDate = toDate(date);
    return validDate.toISOString();
  } catch (error) {
    console.error('Failed to convert date to ISO string:', date, error);
    return new Date().toISOString();
  }
}

/**
 * Debug utility to log date information
 */
export function logDateInfo(label: string, date: any): void {
  console.group(`Date Info: ${label}`);
  
  console.log('Original value:', date);
  
  if (date instanceof Date) {
    console.log('Is Date object: Yes');
    console.log('Is valid Date: ', !isNaN(date.getTime()));
    console.log('ISO String: ', date.toISOString());
    console.log('Local String: ', date.toString());
  } else if (date && typeof date.toDate === 'function') {
    console.log('Is Firestore Timestamp: Yes');
    try {
      const jsDate = date.toDate();
      console.log('Converted to Date: ', jsDate);
      console.log('ISO String: ', jsDate.toISOString());
    } catch (e) {
      console.log('Failed to convert to Date: ', e);
    }
  } else {
    console.log('Is Date object: No');
    console.log('Type: ', typeof date);
    
    try {
      const converted = toDate(date);
      console.log('Converted to Date: ', converted);
      console.log('Is valid Date: ', !isNaN(converted.getTime()));
      console.log('ISO String: ', converted.toISOString());
    } catch (e) {
      console.log('Failed to convert to Date: ', e);
    }
  }
  
  console.groupEnd();
}
