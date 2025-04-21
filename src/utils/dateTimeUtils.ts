import { format } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

/**
 * Gets the user's current time zone
 */
export function getUserTimeZone(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`[getUserTimeZone] detected: ${timeZone}`);
  return timeZone;
}

/**
 * Converts a local date to UTC
 */
export function convertToUtc(localDate: Date): Date {
  const userTimeZone = getUserTimeZone();
  console.log('[convertToUtc] Converting to UTC:', {
    input: localDate.toISOString(),
    timeZone: userTimeZone
  });
  
  const utcDate = zonedTimeToUtc(localDate, userTimeZone);
  
  console.log('[convertToUtc] Result:', utcDate.toISOString());
  return utcDate;
}

/**
 * Converts a UTC date to local time
 */
export function convertToLocal(utcDate: Date): Date {
  const userTimeZone = getUserTimeZone();
  console.log('[convertToLocal] Converting to local:', {
    input: utcDate.toISOString(),
    timeZone: userTimeZone
  });
  
  const localDate = utcToZonedTime(utcDate, userTimeZone);
  
  console.log('[convertToLocal] Result:', localDate.toISOString());
  return localDate;
}

/**
 * Formats a date with timezone consideration
 */
export function formatDateWithTimeZone(date: Date, formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
  const userTimeZone = getUserTimeZone();
  const zonedDate = utcToZonedTime(date, userTimeZone);
  const result = format(zonedDate, formatStr);
  
  console.log('[formatDateWithTimeZone]', {
    input: date.toISOString(),
    timeZone: userTimeZone,
    result
  });
  
  return result;
}

/**
 * Comprehensive utilities for handling date/time operations consistently
 */

/**
 * Logs date information for debugging
 */
export function logDateDetails(label: string, date: Date, additionalInfo?: Record<string, any>) {
  console.log(`[${label}]`, {
    date: date.toISOString(),
    localString: date.toString(),
    time: `${date.getHours()}:${date.getMinutes()}`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...additionalInfo
  });
}

/**
 * Parses time string in "HH:MM AM/PM" format and returns hours/minutes
 */
export function parseTimeString(timeString: string): { hours: number, minutes: number } {
  if (!timeString) return { hours: 0, minutes: 0 };
  
  console.log(`[parseTimeString] input: "${timeString}"`);
  
  const [hoursMinutes, period] = timeString.split(/\s+/);
  const [hoursStr, minutesStr] = hoursMinutes.split(':');
  
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  
  console.log(`[parseTimeString] output: hours=${hours}, minutes=${minutes}`);
  
  return { hours, minutes };
}

/**
 * Parses time string with enhanced compatibility
 * Handles both new format and legacy formats
 */
export function parseTimeStringWithCompatibility(timeString: string): { hours: number, minutes: number } {
  if (!timeString) return { hours: 0, minutes: 0 };
  
  console.log(`[parseTimeString] input: "${timeString}"`);
  
  // Handle multiple possible formats
  let hours = 0;
  let minutes = 0;
  let period = 'AM';
  
  // Try standard "HH:MM AM/PM" format
  const standardFormat = /^(\d{1,2}):(\d{2})\s+(AM|PM)$/i;
  const standardMatch = timeString.match(standardFormat);
  
  if (standardMatch) {
    hours = parseInt(standardMatch[1], 10);
    minutes = parseInt(standardMatch[2], 10);
    period = standardMatch[3].toUpperCase();
  } 
  // Try alternative formats (add any legacy formats here)
  else {
    // Default fallback - basic split by colon and space
    const parts = timeString.split(/[:\s]+/);
    if (parts.length >= 3) {
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
      period = parts[2].toUpperCase();
    }
  }
  
  // Convert to 24-hour format
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  
  console.log(`[parseTimeString] output: hours=${hours}, minutes=${minutes}`);
  
  return { hours, minutes };
}

/**
 * Creates a new Date with the specified time components
 * Always sets seconds and milliseconds to 0
 */
export function createDateWithTime(baseDate: Date, hours: number, minutes: number): Date {
  logDateDetails("createDateWithTime input", baseDate, { hours, minutes });
  
  const newDate = new Date(baseDate);
  newDate.setHours(hours, minutes, 0, 0);
  
  logDateDetails("createDateWithTime output", newDate);
  return newDate;
}

/**
 * Moves a date to tomorrow if it's earlier than current time and is today
 */
export function adjustDateIfPassed(dateToCheck: Date): Date {
  const now = new Date();
  logDateDetails("adjustDateIfPassed input", dateToCheck, { now });
  
  const isToday = isSameDay(dateToCheck, now);
  const needsAdjustment = dateToCheck < now && isToday;
  
  if (needsAdjustment) {
    const tomorrow = new Date(dateToCheck);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    logDateDetails("adjustDateIfPassed output (adjusted)", tomorrow, { 
      reason: "Date is today but already passed" 
    });
    return tomorrow;
  }
  
  logDateDetails("adjustDateIfPassed output (unchanged)", dateToCheck, { 
    reason: "Date is not today or not yet passed" 
  });
  return dateToCheck;
}

/**
 * Formats a time string consistently in 12-hour format with AM/PM
 */
export function formatTimeString(date: Date): string {
  if (!date) return '';
  
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  
  // Ensure two digits for minutes
  const minutesStr = minutes.toString().padStart(2, '0');
  
  const result = `${hours}:${minutesStr} ${period}`;
  console.log(`[formatTimeString] ${date.toString()} → "${result}"`);
  
  return result;
}

/**
 * Checks if two date objects represent the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const result = date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
         
  console.log(`[isSameDay] comparing ${date1.toDateString()} and ${date2.toDateString()}: ${result}`);
  
  return result;
}
