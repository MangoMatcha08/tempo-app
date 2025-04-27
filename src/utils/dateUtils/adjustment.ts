
import { addDays } from 'date-fns';
import { ensureValidDate } from './core';
import { toZonedTime, getUserTimeZone } from './timezoneUtils';

export function adjustDateIfPassed(date: Date): Date {
  const validDate = ensureValidDate(date);
  const now = new Date();
  const timeZone = getUserTimeZone();
  
  // Convert both to local timezone for comparison
  const localDate = toZonedTime(validDate, timeZone);
  const localNow = toZonedTime(now, timeZone);
  
  if (localDate < localNow) {
    // Save the time components before adjustment
    const hours = localDate.getHours();
    const minutes = localDate.getMinutes();
    
    // Add a day while preserving time
    const tomorrow = addDays(localDate, 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    
    return tomorrow;
  }
  
  return validDate;
}
