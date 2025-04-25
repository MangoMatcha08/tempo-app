
import { isTimestamp, isValidDate } from './typeGuards';

/**
 * Ensures a value is a valid Date object
 */
export function ensureValidDate(value: any): Date {
  // Handle Timestamp objects
  if (isTimestamp(value)) {
    return value.toDate();
  }
  
  // Handle valid Date objects
  if (isValidDate(value)) {
    return value;
  }
  
  // Handle ISO strings
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (isValidDate(parsed)) {
      return parsed;
    }
  }
  
  // Handle numeric timestamps
  if (typeof value === 'number' && !isNaN(value)) {
    const parsed = new Date(value);
    if (isValidDate(parsed)) {
      return parsed;
    }
  }
  
  console.warn('Invalid date value encountered:', value);
  return new Date(); // Default to current date as fallback
}

/**
 * Formats a date for display
 */
export function formatDisplayDate(date: Date | any): string {
  const validDate = ensureValidDate(date);
  return validDate.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Gets relative time string
 */
export function getRelativeTimeString(date: Date | any): string {
  const validDate = ensureValidDate(date);
  const now = new Date();
  const diffMs = validDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 0) return 'Past due';
  if (diffMins < 60) return `${diffMins}m`;
  
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
}
