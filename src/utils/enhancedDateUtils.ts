
import { format, addDays, addWeeks, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { mockPeriods } from "./reminderUtils";
import { formatDate, formatWithTimezone } from './dateTransformations';
import { ensureValidDate } from './dateCore';

/**
 * Enhanced date handling utilities for the reminder system
 */

// Get user's timezone
export const getUserTimeZone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Convert date to user's timezone
export const toLocalTime = (date: Date): Date => {
  const timeZone = getUserTimeZone();
  return toZonedTime(date, timeZone);
};

// Convert local time to UTC
export const toUtcTime = (date: Date): Date => {
  const timeZone = getUserTimeZone();
  return fromZonedTime(date, timeZone);
};

// Ensure valid date with timezone consideration
export const ensureValidDate = (date: any): Date => {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return toLocalTime(date);
  }
  
  if (date && typeof date.toDate === 'function') {
    return toLocalTime(date.toDate());
  }
  
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return toLocalTime(parsedDate);
    }
  }
  
  console.warn('Invalid date encountered, using current date', date);
  return toLocalTime(new Date());
};

// Format date with period context
export const formatDateWithPeriod = (date: Date, periodId?: string | null): string => {
  const validDate = ensureValidDate(date);
  const formattedTime = formatDate(validDate, 'h:mm a');
  
  if (periodId) {
    const period = mockPeriods.find(p => p.id === periodId);
    if (period) {
      return `${period.name} (${formattedTime})`;
    }
  }
  
  return formattedTime;
};

// Get relative time display (e.g., "2 hours ago", "in 3 days")
export const getRelativeTimeDisplay = (date: Date): string => {
  const now = new Date();
  const validDate = ensureValidDate(date);
  const diffMs = validDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (Math.abs(diffMins) < 60) {
    const suffix = diffMins >= 0 ? 'from now' : 'ago';
    const absoluteMins = Math.abs(diffMins);
    return `${absoluteMins} minute${absoluteMins !== 1 ? 's' : ''} ${suffix}`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (Math.abs(diffHours) < 24) {
    const suffix = diffHours >= 0 ? 'from now' : 'ago';
    const absoluteHours = Math.abs(diffHours);
    return `${absoluteHours} hour${absoluteHours !== 1 ? 's' : ''} ${suffix}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  const suffix = diffDays >= 0 ? 'from now' : 'ago';
  const absoluteDays = Math.abs(diffDays);
  return `${absoluteDays} day${absoluteDays !== 1 ? 's' : ''} ${suffix}`;
};

// Create a date with specific time components
export const createDateWithTime = (
  baseDate: Date,
  hours: number,
  minutes: number
): Date => {
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Check if a date needs to be moved to tomorrow
export const adjustDateIfPassed = (date: Date): Date => {
  const now = new Date();
  const adjustedDate = new Date(date);
  
  if (adjustedDate < now) {
    return addDays(adjustedDate, 1);
  }
  
  return adjustedDate;
};

// Parse time string (e.g., "3:00 PM")
export const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  const [time, meridiem] = timeStr.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (meridiem?.toLowerCase() === 'pm' && hours < 12) {
    hours += 12;
  } else if (meridiem?.toLowerCase() === 'am' && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
};

// Get the nearest period time
export const getNearestPeriodTime = (date: Date): { periodId: string; startTime: Date } | null => {
  const targetTime = date.getTime();
  let nearestPeriod = null;
  let minDiff = Infinity;
  
  for (const period of mockPeriods) {
    const [hours, minutes] = period.startTime.split(':').map(Number);
    const periodDate = createDateWithTime(date, hours, minutes);
    const diff = Math.abs(periodDate.getTime() - targetTime);
    
    if (diff < minDiff) {
      minDiff = diff;
      nearestPeriod = {
        periodId: period.id,
        startTime: periodDate
      };
    }
  }
  
  return nearestPeriod;
};

// Format date for display
export const formatDisplayDate = (date: Date): string => {
  return format(ensureValidDate(date), 'MMM d, yyyy h:mm a');
};
