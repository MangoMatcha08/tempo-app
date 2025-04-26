
// Re-export from dateUtils for backward compatibility
import { 
  ensureValidDate,
  parseTimeString,
  formatTimeString,
  formatDate,
  toZonedTime,
  fromZonedTime
} from './dateUtils';

export { 
  ensureValidDate,
  parseTimeString,
  formatTimeString,
  formatDate
};

/**
 * Create a date with specific time components
 */
export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Adjust date if it's in the past (used for reminders)
 */
export function adjustDateIfPassed(date: Date): Date {
  const now = new Date();
  const adjustedDate = new Date(date);
  
  // If date is in the past, move it to tomorrow
  if (adjustedDate < now) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }
  
  return adjustedDate;
}

/**
 * Log date details for debugging
 */
export function logDateDetails(label: string, date: Date): void {
  console.log(`[${label}]`, {
    date: date.toString(),
    iso: date.toISOString(),
    time: date.toLocaleTimeString(),
    timestamp: date.getTime()
  });
}

// Convert timezone functions for compatibility
// These are now wrappers around the renamed functions from date-fns-tz v3
export function convertToUtc(date: Date): Date {
  return fromZonedTime(date, 'UTC');
}

export function convertToLocal(date: Date): Date {
  return toZonedTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
}

// Export the original functions for direct use
export { toZonedTime as convertToZonedTime } from './dateUtils';
export { fromZonedTime as convertFromZonedTime } from './dateUtils';
