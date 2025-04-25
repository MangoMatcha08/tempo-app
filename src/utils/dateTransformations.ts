
import { format, parse, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ensureValidDate } from './enhancedDateUtils';

/**
 * Parse various date string formats into a valid Date object
 */
export function parseStringToDate(dateStr: string): Date | null {
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-dd HH:mm',
    'MM/dd/yyyy HH:mm',
    'HH:mm'
  ];

  for (const formatStr of formats) {
    try {
      const parsed = parse(dateStr, formatStr, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  // Try native Date parsing as a fallback
  const nativeParsed = new Date(dateStr);
  return isValid(nativeParsed) ? nativeParsed : null;
}

/**
 * Compare two dates and determine their relationship
 */
export function compareDates(date1: Date | string, date2: Date | string): -1 | 0 | 1 {
  const validDate1 = ensureValidDate(date1);
  const validDate2 = ensureValidDate(date2);
  
  const time1 = validDate1.getTime();
  const time2 = validDate2.getTime();
  
  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
}

/**
 * Check if a date falls within a range
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const validDate = ensureValidDate(date);
  const validStart = ensureValidDate(startDate);
  const validEnd = ensureValidDate(endDate);
  
  return validDate >= validStart && validDate <= validEnd;
}

/**
 * Format a date to a consistent string representation with timezone consideration
 */
export function formatWithTimezone(date: Date | string, format = 'yyyy-MM-dd HH:mm'): string {
  const validDate = ensureValidDate(date);
  const zonedDate = toZonedTime(validDate, Intl.DateTimeFormat().resolvedOptions().timeZone);
  return formatDate(zonedDate, format);
}

/**
 * Format a date using a specific format string
 */
export function formatDate(date: Date | string, formatStr = 'yyyy-MM-dd HH:mm'): string {
  const validDate = ensureValidDate(date);
  return format(validDate, formatStr);
}

/**
 * Check if two dates represent the same time (ignoring milliseconds)
 */
export function areDatesEqual(date1: Date | string, date2: Date | string): boolean {
  const validDate1 = ensureValidDate(date1);
  const validDate2 = ensureValidDate(date2);
  
  return (
    validDate1.getFullYear() === validDate2.getFullYear() &&
    validDate1.getMonth() === validDate2.getMonth() &&
    validDate1.getDate() === validDate2.getDate() &&
    validDate1.getHours() === validDate2.getHours() &&
    validDate1.getMinutes() === validDate2.getMinutes()
  );
}

