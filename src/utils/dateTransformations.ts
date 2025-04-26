
import { format, isAfter, isBefore } from 'date-fns';
import { ensureValidDate } from './dateUtils/core';
import { formatWithTimeZone } from './dateUtils/timezone';

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

export function formatDate(date: Date | string | null | undefined, formatStr: string = 'yyyy-MM-dd'): string {
  try {
    const validDate = ensureValidDate(date);
    return format(validDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function compareDates(date1: Date, date2: Date): number {
  const validDate1 = ensureValidDate(date1);
  const validDate2 = ensureValidDate(date2);
  
  return validDate1.getTime() - validDate2.getTime();
}

export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const validDate = ensureValidDate(date);
  const validStartDate = ensureValidDate(startDate);
  const validEndDate = ensureValidDate(endDate);
  
  return !isBefore(validDate, validStartDate) && !isAfter(validDate, validEndDate);
}

// Re-export the centralized formatWithTimeZone function
export { formatWithTimeZone };

export function areDatesEqual(date1: Date, date2: Date): boolean {
  const validDate1 = ensureValidDate(date1);
  const validDate2 = ensureValidDate(date2);
  
  return validDate1.getTime() === validDate2.getTime();
}
