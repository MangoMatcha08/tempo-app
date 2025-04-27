
import { addDays } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { ensureValidDate } from './core';
import type { TimeComponents } from './types';

/**
 * Extracts time components from a date while preserving timezone
 */
function extractTimeComponents(date: Date, timeZone?: string): TimeComponents {
  const zonedDate = timeZone ? toZonedTime(date, timeZone) : date;
  return {
    hours: zonedDate.getHours(),
    minutes: zonedDate.getMinutes()
  };
}

/**
 * Applies time components to a date while preserving timezone
 */
function applyTimeComponents(date: Date, time: TimeComponents, timeZone?: string): Date {
  const targetDate = new Date(date);
  targetDate.setHours(time.hours, time.minutes, 0, 0);
  
  if (timeZone) {
    // Convert to specified timezone, then back to ensure proper DST handling
    return fromZonedTime(toZonedTime(targetDate, timeZone), timeZone);
  }
  
  return targetDate;
}

/**
 * Adjusts a date if it's in the past, preserving time components and handling timezones
 */
export function adjustDateIfPassed(date: Date, timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): Date {
  try {
    const validDate = ensureValidDate(date);
    const now = new Date();
    
    // Convert both dates to target timezone for comparison
    const zonedDate = toZonedTime(validDate, timeZone);
    const zonedNow = toZonedTime(now, timeZone);
    
    if (zonedDate < zonedNow) {
      // Save original time components
      const timeComponents = extractTimeComponents(zonedDate, timeZone);
      
      // Add a day and reapply the original time, ensuring timezone consistency
      const tomorrow = addDays(zonedDate, 1);
      const adjustedDate = applyTimeComponents(tomorrow, timeComponents, timeZone);
      
      // Convert back to the original timezone context
      return fromZonedTime(adjustedDate, timeZone);
    }
    
    return validDate;
  } catch (error) {
    console.error('Error adjusting date:', error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Validates if a date falls on a DST transition
 */
export function isOnDstTransition(date: Date, timeZone?: string): boolean {
  try {
    const validDate = ensureValidDate(date);
    if (!timeZone) return false;
    
    // Format date in target timezone at the exact time
    const formatted = formatInTimeZone(validDate, timeZone, 'HH:mm');
    
    // Check one minute before and after for DST transition
    const before = new Date(validDate.getTime() - 60000);
    const after = new Date(validDate.getTime() + 60000);
    
    const beforeFormatted = formatInTimeZone(before, timeZone, 'HH:mm');
    const afterFormatted = formatInTimeZone(after, timeZone, 'HH:mm');
    
    // If there's a DST transition, the time difference won't be exactly 1 minute
    return beforeFormatted === formatted || afterFormatted === formatted;
  } catch (error) {
    console.error('Error checking DST transition:', error);
    return false;
  }
}
