
import { ensureValidDate } from './core';
import { formatWithTimeZone } from './timezoneUtils';
import { format, isAfter, isBefore } from 'date-fns';

/**
 * Transforms dates between different formats
 */

export function parseStringToDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  try {
    // Try ISO format
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // Try other common formats if needed
    return null;
  } catch {
    return null;
  }
}

export function convertToUtc(date: Date): Date {
  const validDate = ensureValidDate(date);
  const isoString = validDate.toISOString();
  return new Date(isoString);
}

export function convertToLocal(date: Date): Date {
  const validDate = ensureValidDate(date);
  // Convert from UTC to local time
  return new Date(validDate.getTime() + validDate.getTimezoneOffset() * 60000);
}

export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const validDate = ensureValidDate(date);
  const validStartDate = ensureValidDate(startDate);
  const validEndDate = ensureValidDate(endDate);
  
  return !isBefore(validDate, validStartDate) && !isAfter(validDate, validEndDate);
}

export function areDatesEqual(date1: Date, date2: Date): boolean {
  const validDate1 = ensureValidDate(date1);
  const validDate2 = ensureValidDate(date2);
  
  return validDate1.getTime() === validDate2.getTime();
}
