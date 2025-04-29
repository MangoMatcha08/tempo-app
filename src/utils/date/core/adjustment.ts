
/**
 * Date adjustment utilities
 */
import { addDays } from 'date-fns';
import { ensureValidDate } from './validation';
import { toZonedTime } from './timezone';

/**
 * Adjusts a date if it has already passed by adding one day
 * Useful for ensuring due dates aren't in the past
 * 
 * @param date The date to adjust
 * @returns The adjusted date (or original if not passed)
 */
export function adjustDateIfPassed(date: Date): Date {
  const validDate = ensureValidDate(date);
  const now = new Date();
  
  // Compare dates in UTC
  const utcDate = toZonedTime(validDate, 'UTC');
  const utcNow = toZonedTime(now, 'UTC');
  
  if (utcDate < utcNow) {
    // Add one day to the UTC date
    const tomorrow = addDays(utcDate, 1);
    
    // Ensure the time components are preserved
    tomorrow.setUTCHours(
      utcDate.getUTCHours(),
      utcDate.getUTCMinutes(),
      0,
      0
    );
    
    return tomorrow;
  }
  
  return validDate;
}
