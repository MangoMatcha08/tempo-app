
import { format, addDays } from 'date-fns';
import { ensureValidDate } from './dateCore';
import { Period } from '@/contexts/ScheduleContext';
import type { ReminderCategory, ReminderPriority } from '@/types/reminderTypes';

export function findAvailableTimeSlots(
  periods: Period[],
  minDuration: number = 30,
  date: Date = new Date()
): Array<{ startTime: Date; endTime: Date; periodId?: string }> {
  const validDate = ensureValidDate(date);
  return periods.map(period => {
    const periodStart = new Date(validDate);
    const periodEnd = new Date(validDate);
    
    // Set hours and minutes from period times
    const [startHours, startMins] = period.startTime.split(':').map(Number);
    const [endHours, endMins] = period.endTime.split(':').map(Number);
    
    periodStart.setHours(startHours, startMins, 0, 0);
    periodEnd.setHours(endHours, endMins, 0, 0);
    
    return {
      startTime: periodStart,
      endTime: periodEnd,
      periodId: period.id
    };
  });
}

export function suggestIdealPeriods(
  periods: Period[],
  duration: number = 30,
  preferredTypes: string[] = []
): Period[] {
  return periods.filter(period => {
    if (preferredTypes.length > 0 && !preferredTypes.includes(period.type)) {
      return false;
    }
    return true;
  });
}

export function suggestDueDates(
  category: ReminderCategory,
  priority: ReminderPriority,
  description: string = "",
  periods: Period[] = []
): Date[] {
  const now = new Date();
  const suggestions: Date[] = [];
  
  // Add immediate suggestions based on priority
  if (priority === 'high') {
    suggestions.push(now);
    suggestions.push(addDays(now, 1));
  } else if (priority === 'medium') {
    suggestions.push(addDays(now, 2));
  } else {
    suggestions.push(addDays(now, 3));
  }
  
  return suggestions;
}

export function detectDateConflicts(
  date: Date,
  periods: Period[],
  existingReminders: Array<{ dueDate: Date; priority: ReminderPriority; category: ReminderCategory }> = []
): { hasConflict: boolean; conflicts: any[] } {
  const validDate = ensureValidDate(date);
  const conflicts = existingReminders.filter(reminder => {
    const reminderDate = ensureValidDate(reminder.dueDate);
    return format(validDate, 'yyyy-MM-dd') === format(reminderDate, 'yyyy-MM-dd');
  });
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}
