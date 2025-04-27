import { addDays, addWeeks, addMonths, isEqual, isBefore } from 'date-fns';
import { ensureValidDate } from './core';

/**
 * Enum for recurrence types
 */
export enum RecurrenceType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM'
}

/**
 * Interface for recurrence rules
 */
export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  startDate: Date;
  endDate?: Date | null;
  count?: number | null;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  exclusions?: Date[];
}

/**
 * Generates occurrence dates based on recurrence rule
 */
export function generateOccurrences(rule: RecurrenceRule, maxOccurrences: number = 100): Date[] {
  const occurrences: Date[] = [];
  const startDate = ensureValidDate(rule.startDate);
  const maxCount = rule.count || maxOccurrences;
  
  let currentDate = new Date(startDate);
  let count = 0;
  
  // Include start date
  occurrences.push(new Date(currentDate));
  count++;
  
  // Generate subsequent occurrences
  while (count < maxCount) {
    // Generate next date based on recurrence type
    switch (rule.type) {
      case RecurrenceType.DAILY:
        currentDate = addDays(currentDate, rule.interval || 1);
        break;
      case RecurrenceType.WEEKLY:
        currentDate = addWeeks(currentDate, rule.interval || 1);
        break;
      case RecurrenceType.MONTHLY:
        currentDate = addMonths(currentDate, rule.interval || 1);
        break;
      default:
        return occurrences;
    }
    
    // Stop if we've passed the end date
    if (rule.endDate && isBefore(rule.endDate, currentDate)) {
      break;
    }
    
    occurrences.push(new Date(currentDate));
    count++;
  }
  
  return occurrences;
}

/**
 * Finds available time slots based on existing periods
 */
export function findAvailableTimeSlots(periods: any[], minDuration: number = 30, date: Date = new Date()): Array<{ start: Date, end: Date, duration: number }> {
  // Placeholder implementation
  return [{ 
    start: new Date(date), 
    end: new Date(date.getTime() + minDuration * 60000),
    duration: minDuration
  }];
}

/**
 * Suggests ideal periods for scheduling
 */
export function suggestIdealPeriods(periods: any[], duration: number = 30, preferredTypes: string[] = []): any[] {
  // Placeholder implementation
  return periods.filter(period => 
    preferredTypes.length === 0 || preferredTypes.includes(period.type)
  );
}

/**
 * Suggests due dates based on reminder category and priority
 */
export function suggestDueDates(category: string, priority: string, description: string = "", periods: any[] = []): Date[] {
  // Placeholder implementation
  const now = new Date();
  return [
    now,
    addDays(now, 1),
    addDays(now, 3)
  ];
}

/**
 * Detects date conflicts with existing reminders
 */
export function detectDateConflicts(date: Date, periods: any[], existingReminders: any[] = []): boolean {
  // Placeholder implementation
  return false;
}

/**
 * Memoizes a date function for better performance
 */
export function memoizeDateFn<T extends (...args: any[]) => any>(
  key: string,
  fn: T,
  ttl: number = 60000
): T {
  const cache = new Map<string, { value: any, timestamp: number }>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const cacheKey = `${key}:${JSON.stringify(args)}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    
    if (cached && now - cached.timestamp < ttl) {
      return cached.value as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(cacheKey, { value: result, timestamp: now });
    
    return result;
  }) as T;
}
