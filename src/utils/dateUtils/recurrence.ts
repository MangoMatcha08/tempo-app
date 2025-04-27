
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { ensureValidDate } from './core';
import { Period } from '@/types/periodTypes';
import { ReminderCategory, ReminderPriority } from '@/types/reminderTypes';

export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  startDate: Date;
  count?: number | null;
  endDate?: Date | null;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number;
}

/**
 * Generates occurrences based on a recurrence rule
 */
export function generateOccurrences(rule: RecurrenceRule, maxOccurrences: number = 10): Date[] {
  const occurrences: Date[] = [];
  const { type, interval, startDate } = rule;
  const maxCount = rule.count || maxOccurrences;
  const endDate = rule.endDate;
  
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < maxCount; i++) {
    if (i > 0) {
      // Skip the first one since it's the start date
      switch (type) {
        case RecurrenceType.DAILY:
          currentDate = addDays(currentDate, interval);
          break;
        case RecurrenceType.WEEKLY:
          currentDate = addWeeks(currentDate, interval);
          break;
        case RecurrenceType.MONTHLY:
          currentDate = addMonths(currentDate, interval);
          break;
        case RecurrenceType.YEARLY:
          currentDate = addYears(currentDate, interval);
          break;
        case RecurrenceType.CUSTOM:
          // Custom handling would go here
          currentDate = addDays(currentDate, interval);
          break;
      }
    }
    
    // Check if we've passed the end date
    if (endDate && currentDate > endDate) {
      break;
    }
    
    occurrences.push(new Date(currentDate));
  }
  
  return occurrences;
}

/**
 * Finds available time slots in a periods array
 */
export function findAvailableTimeSlots(
  periods: Period[],
  minDuration: number = 30,
  date: Date = new Date()
): Array<{ start: Date; end: Date; duration: number }> {
  // Placeholder implementation
  return [
    { 
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0), 
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
      duration: 60
    },
    { 
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 13, 0), 
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0),
      duration: 60
    }
  ];
}

/**
 * Suggests ideal periods based on availability
 */
export function suggestIdealPeriods(
  periods: Period[],
  duration: number = 30,
  preferredTypes: string[] = []
): Period[] {
  // Placeholder implementation
  return periods.filter(p => {
    if (preferredTypes.length > 0) {
      return preferredTypes.includes(p.type);
    }
    return true;
  }).slice(0, 3);
}

/**
 * Suggests due dates based on reminder properties
 */
export function suggestDueDates(
  category: ReminderCategory,
  priority: ReminderPriority,
  description: string = "",
  periods: Period[] = []
): Date[] {
  // Placeholder implementation
  const today = new Date();
  return [
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0)
  ];
}

/**
 * Detects date conflicts with existing reminders
 */
export function detectDateConflicts(
  date: Date,
  periods: Period[],
  existingReminders: Array<{ dueDate: Date; priority: ReminderPriority; category: ReminderCategory }> = []
): { hasConflicts: boolean; conflicts: Array<{ type: string; priority: ReminderPriority }> } {
  // Placeholder implementation
  const conflicts = existingReminders
    .filter(reminder => {
      const reminderDate = reminder.dueDate;
      return Math.abs(reminderDate.getTime() - date.getTime()) < 30 * 60 * 1000; // Within 30 minutes
    })
    .map(reminder => ({
      type: 'time',
      priority: reminder.priority
    }));
    
  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}

/**
 * Utility for memoizing date functions
 */
export function memoizeDateFn<T extends (...args: any[]) => any>(
  key: string,
  fn: T,
  ttl: number = 5 * 60 * 1000 // 5 minutes by default
): T {
  const cache: Record<string, { value: any; timestamp: number }> = {};
  
  return ((...args: any[]) => {
    const cacheKey = `${key}_${JSON.stringify(args)}`;
    const now = Date.now();
    
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < ttl) {
      return cache[cacheKey].value;
    }
    
    const result = fn(...args);
    
    cache[cacheKey] = {
      value: result,
      timestamp: now
    };
    
    return result;
  }) as T;
}
