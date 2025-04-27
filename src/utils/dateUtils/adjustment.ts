
import { addDays } from 'date-fns';
import { ensureValidDate } from './core';
import { toZonedTime, fromZonedTime } from './timezoneUtils';

export function adjustDateIfPassed(date: Date): Date {
  try {
    const validDate = ensureValidDate(date);
    const now = new Date();
    
    // Convert both to local timezone for comparison
    const localDate = toZonedTime(validDate);
    const localNow = toZonedTime(now);
    
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
  } catch (error) {
    console.error('Error adjusting date:', error);
    return new Date();
  }
}

export function isOnDstTransition(date: Date): boolean {
  try {
    const validDate = ensureValidDate(date);
    const before = new Date(validDate.getTime() - 60000);
    const after = new Date(validDate.getTime() + 60000);
    
    return before.getTimezoneOffset() !== after.getTimezoneOffset();
  } catch (error) {
    console.error('Error checking DST transition:', error);
    return false;
  }
}

