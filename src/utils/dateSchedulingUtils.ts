
import { format, addDays } from 'date-fns';
import { ensureValidDate } from './dateCore';
import type { Period } from '@/types/periodTypes';
import type { ReminderCategory, ReminderPriority } from '@/types/reminderTypes';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  periodId?: string;
}

export function findAvailableTimeSlots(
  periods: Period[],
  minDuration: number = 30,
  date: Date = new Date()
): TimeSlot[] {
  const validDate = ensureValidDate(date);
  return periods.map(period => {
    const periodStart = new Date(validDate);
    const periodEnd = new Date(validDate);
    
    // Parse period times
    const startTimeStr = period.startTime instanceof Date ? 
      format(period.startTime, 'HH:mm') : 
      period.startTime;
    const endTimeStr = period.endTime instanceof Date ? 
      format(period.endTime, 'HH:mm') : 
      period.endTime;
    
    const [startHours, startMins] = String(startTimeStr).split(':').map(Number);
    const [endHours, endMins] = String(endTimeStr).split(':').map(Number);
    
    if (!isNaN(startHours) && !isNaN(startMins)) {
      periodStart.setHours(startHours, startMins, 0, 0);
    }
    
    if (!isNaN(endHours) && !isNaN(endMins)) {
      periodEnd.setHours(endHours, endMins, 0, 0);
    }
    
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
