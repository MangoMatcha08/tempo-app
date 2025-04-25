
import { format, addDays } from 'date-fns';
import { ensureValidDate } from './enhancedDateUtils';
import { Period } from '@/contexts/ScheduleContext';
import type { ReminderCategory, ReminderPriority } from '@/types/reminderTypes';

export const findAvailableTimeSlots = (
  periods: Period[],
  minDuration: number = 30,
  date: Date = new Date()
): { startTime: Date; endTime: Date; periodId?: string }[] => {
  const validDate = ensureValidDate(date);
  return periods.map(period => ({
    startTime: new Date(validDate.setHours(...period.startTime.split(':').map(Number))),
    endTime: new Date(validDate.setHours(...period.endTime.split(':').map(Number))),
    periodId: period.id
  }));
};

export const suggestIdealPeriods = (
  periods: Period[],
  duration: number = 30,
  preferredTypes: string[] = []
): Period[] => {
  return periods.filter(period => {
    if (preferredTypes.length && !preferredTypes.includes(period.type)) {
      return false;
    }
    // Simple duration check - can be enhanced based on requirements
    const [startHour, startMin] = period.startTime.split(':').map(Number);
    const [endHour, endMin] = period.endTime.split(':').map(Number);
    const periodDuration = (endHour - startHour) * 60 + (endMin - startMin);
    return periodDuration >= duration;
  });
};

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

export const detectDateConflicts = (
  date: Date,
  periods: Period[],
  existingReminders: Array<{ dueDate: Date; priority: ReminderPriority; category: ReminderCategory }> = []
): { hasConflict: boolean; conflicts: any[] } => {
  const conflicts = existingReminders.filter(reminder => 
    format(reminder.dueDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
};
