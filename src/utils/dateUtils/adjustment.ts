
import { addDays } from 'date-fns';
import { ensureValidDate } from './core';
import { toZonedTime, fromZonedTime, getUserTimeZone } from './timezoneUtils';

export function adjustDateIfPassed(date: Date): Date {
  const validDate = ensureValidDate(date);
  const now = new Date();
  const timeZone = getUserTimeZone();
  
  // Convert dates to UTC for comparison to avoid timezone issues
  const localDate = toZonedTime(validDate, 'UTC');
  const localNow = toZonedTime(now, 'UTC');
  
  if (localDate < localNow) {
    // Convert to user's timezone to preserve correct time components
    const zonedDate = toZonedTime(validDate, timeZone);
    
    // Save the time components
    const hours = zonedDate.getHours();
    const minutes = zonedDate.getMinutes();
    
    // Add a day while preserving time components
    const zonedTomorrow = addDays(zonedDate, 1);
    zonedTomorrow.setHours(hours, minutes, 0, 0);
    
    // Convert back to UTC for return
    return fromZonedTime(zonedTomorrow, timeZone);
  }
  
  return validDate;
}
