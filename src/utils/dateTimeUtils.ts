
import { format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { toDate, isValidDate } from './dateTransformationUtils';

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
export function convertToUtc(localDate: Date | any): Date {
  // Ensure we have a valid Date object
  const validDate = toDate(localDate);
  const userTimeZone = getUserTimeZone();
  
  console.log('[convertToUtc] Converting to UTC:', {
    input: validDate.toISOString(),
    timeZone: userTimeZone
  });
  
  const utcDate = fromZonedTime(validDate, userTimeZone);
  
  console.log('[convertToUtc] Result:', utcDate.toISOString());
  return utcDate;
}

/**
 * Converts a UTC date to local time
 */
export function convertToLocal(utcDate: Date | any): Date {
  // Ensure we have a valid Date object
  const validDate = toDate(utcDate);
  const userTimeZone = getUserTimeZone();
  
  console.log('[convertToLocal] Converting to local:', {
    input: validDate.toISOString(),
    timeZone: userTimeZone
  });
  
  const localDate = toZonedTime(validDate, userTimeZone);
  
  console.log('[convertToLocal] Result:', localDate.toISOString());
  return localDate;
}

/**
 * Formats a date with timezone consideration
 */
export function formatDateWithTimeZone(date: Date | any, formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
  try {
    const validDate = toDate(date);
    const userTimeZone = getUserTimeZone();
    const zonedDate = toZonedTime(validDate, userTimeZone);
    const result = format(zonedDate, formatStr);
    
    console.log('[formatDateWithTimeZone]', {
      input: validDate.toISOString(),
      timeZone: userTimeZone,
      result
    });
    
    return result;
  } catch (error) {
    console.error("Error in formatDateWithTimeZone:", error);
    return format(new Date(), formatStr); // Fallback to current date
  }
}

/**
 * Comprehensive utilities for handling date/time operations consistently
 */

/**
 * Logs date information for debugging
 */
export function logDateDetails(label: string, date: Date | any, additionalInfo?: Record<string, any>) {
  try {
    const validDate = toDate(date);
    console.log(`[${label}]`, {
      date: validDate.toISOString(),
      localString: validDate.toString(),
      time: `${validDate.getHours()}:${validDate.getMinutes()}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...additionalInfo
    });
  } catch (error) {
    console.error(`Error logging date details for "${label}":`, error);
  }
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
export function createDateWithTime(baseDate: Date | any, hours: number, minutes: number): Date {
  try {
    const validBaseDate = toDate(baseDate);
    logDateDetails("createDateWithTime input", validBaseDate, { hours, minutes });
    
    const newDate = new Date(validBaseDate);
    newDate.setHours(hours, minutes, 0, 0);
    
    logDateDetails("createDateWithTime output", newDate);
    return newDate;
  } catch (error) {
    console.error("Error in createDateWithTime:", error);
    // Fallback to current date with specified hours/minutes
    const fallbackDate = new Date();
    fallbackDate.setHours(hours, minutes, 0, 0);
    return fallbackDate;
  }
}

/**
 * Moves a date to tomorrow if it's earlier than current time and is today
 */
export function adjustDateIfPassed(dateToCheck: Date | any): Date {
  try {
    const validDate = toDate(dateToCheck);
    const now = new Date();
    logDateDetails("adjustDateIfPassed input", validDate, { now });
    
    const isToday = isSameDay(validDate, now);
    const needsAdjustment = validDate < now && isToday;
    
    if (needsAdjustment) {
      const tomorrow = new Date(validDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      logDateDetails("adjustDateIfPassed output (adjusted)", tomorrow, { 
        reason: "Date is today but already passed" 
      });
      return tomorrow;
    }
    
    logDateDetails("adjustDateIfPassed output (unchanged)", validDate, { 
      reason: "Date is not today or not yet passed" 
    });
    return validDate;
  } catch (error) {
    console.error("Error in adjustDateIfPassed:", error);
    return new Date(); // Fallback to current date
  }
}

/**
 * Formats a time string consistently in 12-hour format with AM/PM
 */
export function formatTimeString(date: Date | any): string {
  if (!date) return '';
  
  try {
    const validDate = toDate(date);
    let hours = validDate.getHours();
    const minutes = validDate.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    // Ensure two digits for minutes
    const minutesStr = minutes.toString().padStart(2, '0');
    
    const result = `${hours}:${minutesStr} ${period}`;
    console.log(`[formatTimeString] ${validDate.toString()} → "${result}"`);
    
    return result;
  } catch (error) {
    console.error("Error in formatTimeString:", error, date);
    return "";
  }
}

/**
 * Checks if two date objects represent the same day
 */
export function isSameDay(date1: Date | any, date2: Date | any): boolean {
  try {
    const validDate1 = toDate(date1);
    const validDate2 = toDate(date2);
    
    const result = validDate1.getDate() === validDate2.getDate() &&
           validDate1.getMonth() === validDate2.getMonth() &&
           validDate1.getFullYear() === validDate2.getFullYear();
           
    console.log(`[isSameDay] comparing ${validDate1.toDateString()} and ${validDate2.toDateString()}: ${result}`);
    
    return result;
  } catch (error) {
    console.error("Error in isSameDay:", error, { date1, date2 });
    return false;
  }
}
