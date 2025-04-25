import { format, addDays } from 'date-fns';
import { ensureValidDate } from './enhancedDateUtils';
import { Period } from '@/contexts/ScheduleContext';
import type { ReminderCategory, ReminderPriority } from '@/types/reminderTypes';

interface TimeComponents {
  hours: number;
  minutes: number;
}

const parseTimeString = (timeStr: string): TimeComponents => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return {
    hours: hours || 0,
    minutes: minutes || 0
  };
};

const formatTimeString = (date: Date): string => {
  return format(date, 'HH:mm');
};

/**
 * Finds available time slots based on periods
 */
export const findAvailableTimeSlots = (
  periods: Period[],
  minDuration: number = 30,
  date: Date = new Date()
): { startTime: Date; endTime: Date; periodId?: string }[] => {
  const validDate = ensureValidDate(date);
  const baseDate = new Date(validDate);
  
  return periods.map(period => {
    const startComponents = parseTimeString(period.startTime);
    const endComponents = parseTimeString(period.endTime);
    
    const periodStartTime = new Date(baseDate);
    periodStartTime.setHours(startComponents.hours, startComponents.minutes, 0, 0);
    
    const periodEndTime = new Date(baseDate);
    periodEndTime.setHours(endComponents.hours, endComponents.minutes, 0, 0);
    
    return {
      startTime: periodStartTime,
      endTime: periodEndTime,
      periodId: period.id
    };
  });
};

/**
 * Suggests ideal periods based on duration and preferences
 */
export const suggestIdealPeriods = (
  periods: Period[],
  duration: number = 30,
  preferredTypes: string[] = []
): Period[] => {
  return periods.filter(period => {
    if (preferredTypes.length && !preferredTypes.includes(period.type)) {
      return false;
    }
    
    const startComponents = parseTimeString(period.startTime);
    const endComponents = parseTimeString(period.endTime);
    
    const periodDuration = (endComponents.hours - startComponents.hours) * 60 + 
                         (endComponents.minutes - startComponents.minutes);
    return periodDuration >= duration;
  });
};

/**
 * Suggests due dates based on reminder properties
 * @param category Reminder category
 * @param priority Reminder priority
 * @param description Optional description text
 * @param periods Optional list of periods to consider
 * @returns Array of suggested due dates
 */
export const suggestDueDates = (
  category: ReminderCategory,
  priority: ReminderPriority,
  description: string = "",
  periods: Period[] = []
): Date[] => {
  const now = new Date();
  const suggestions: Date[] = [];
  
  // Add immediate suggestions based on priority
  if (priority === 'high') {
    suggestions.push(now);
    suggestions.push(addDays(now, 1));
  } else {
    suggestions.push(addDays(now, 2));
    suggestions.push(addDays(now, 3));
  }
  
  return suggestions;
};

/**
 * Detects date conflicts with existing reminders
 * @param date Date to check for conflicts
 * @param periods List of periods
 * @param existingReminders Existing reminders to check against
 * @returns Object containing conflict information
 */
export const detectDateConflicts = (
  date: Date,
  periods: Period[],
  existingReminders: Array<{ dueDate: Date; priority: ReminderPriority; category: ReminderCategory }> = []
): { hasConflict: boolean; conflicts: any[] } => {
  // Ensure we have valid dates
  const validDate = ensureValidDate(date);
  const dateString = format(validDate, 'yyyy-MM-dd');
  
  const conflicts = existingReminders.filter(reminder => {
    const reminderDate = ensureValidDate(reminder.dueDate);
    return format(reminderDate, 'yyyy-MM-dd') === dateString;
  });
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
};
