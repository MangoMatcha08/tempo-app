import { addDays } from 'date-fns';
import { ensureValidDate } from './core';
import { toZonedTime, fromZonedTime, getUserTimeZone } from './timezoneUtils';

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

// Alias for debugDate to keep backward compatibility
export { logDateDetails as debugDate } from './core';
