
import { format, addDays } from 'date-fns';
import { ensureValidDate } from './enhancedDateUtils';
import { Period } from '@/contexts/ScheduleContext';
import type { ReminderCategory, ReminderPriority } from '@/types/reminderTypes';

/**
 * Finds available time slots based on periods
 * @param periods List of periods to check
 * @param minDuration Minimum duration in minutes
 * @param date Base date to use
 * @returns Array of available time slots
 */
export const findAvailableTimeSlots = (
  periods: Period[],
  minDuration: number = 30,
  date: Date = new Date()
): { startTime: Date; endTime: Date; periodId?: string }[] => {
  const validDate = ensureValidDate(date);
  const baseDate = new Date(validDate);
  
  return periods.map(period => {
    // Safely parse time strings to hours and minutes
    const [startHour, startMinute] = period.startTime.split(':').map(Number);
    const [endHour, endMinute] = period.endTime.split(':').map(Number);
    
    // Create new dates for start and end times
    const startTime = new Date(baseDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(baseDate);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    return {
      startTime,
      endTime,
      periodId: period.id
    };
  });
};

/**
 * Suggests ideal periods based on duration and preferences
 * @param periods List of periods to check
 * @param duration Required duration in minutes
 * @param preferredTypes Preferred period types
 * @returns Filtered list of periods
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
    
    // Safely parse time strings to calculate duration
    const [startHour, startMin] = period.startTime.split(':').map(Number);
    const [endHour, endMin] = period.endTime.split(':').map(Number);
    
    const periodDuration = (endHour - startHour) * 60 + (endMin - startMin);
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
