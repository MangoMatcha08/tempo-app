
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
 * Formats a date to a consistent time string format
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

/**
 * Gets the user's current time zone
 */
export function getUserTimeZone(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`[getUserTimeZone] detected: ${timeZone}`);
  return timeZone;
}

