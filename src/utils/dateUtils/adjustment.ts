
import { addDays } from 'date-fns';
import { ensureValidDate } from './core';
import { toZonedTime, fromZonedTime, getUserTimeZone } from './timezoneUtils';

export function adjustDateIfPassed(date: Date): Date {
  const validDate = ensureValidDate(date);
  const now = new Date();
  const timeZone = getUserTimeZone();
  
  // Convert both to local timezone for comparison
  const localDate = toZonedTime(validDate, timeZone);
  const localNow = toZonedTime(now, timeZone);
  
  if (localDate < localNow) {
    // Save the time components
    const hours = localDate.getHours();
    const minutes = localDate.getMinutes();
    
    // Add a day and preserve time components
    const zonedTomorrow = addDays(localDate, 1);
    zonedTomorrow.setHours(hours, minutes, 0, 0);
    
    // Convert back to UTC before returning
    return fromZonedTime(zonedTomorrow, timeZone);
  }
  
  return validDate;
}
