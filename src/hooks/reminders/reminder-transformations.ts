
import { Reminder } from "@/types/reminderTypes";
import { formatDistanceToNow, isSameDay, isToday, isYesterday, isTomorrow } from "date-fns";

// Type for UI enhanced reminder (with formatted strings)
export interface UIEnhancedReminder extends Reminder {
  timeRemaining?: string;
  formattedDate?: string; 
  completedTimeAgo?: string;
}

/**
 * Transform reminders by adding UI-specific properties
 */
export const transformReminders = (reminders: Reminder[]): UIEnhancedReminder[] => {
  return reminders.map(reminder => {
    const uiReminder: UIEnhancedReminder = { ...reminder };
    
    // Add timeRemaining property
    if (reminder.dueDate) {
      uiReminder.timeRemaining = formatDistanceToNow(reminder.dueDate, { addSuffix: true });
    }
    
    // Add formattedDate property
    if (reminder.dueDate) {
      if (isToday(reminder.dueDate)) {
        uiReminder.formattedDate = "Today";
      } else if (isTomorrow(reminder.dueDate)) {
        uiReminder.formattedDate = "Tomorrow";
      } else if (isYesterday(reminder.dueDate)) {
        uiReminder.formattedDate = "Yesterday";
      } else {
        const options: Intl.DateTimeFormatOptions = { 
          month: 'short', 
          day: 'numeric',
          year: new Date().getFullYear() !== reminder.dueDate.getFullYear() ? 'numeric' : undefined
        };
        uiReminder.formattedDate = reminder.dueDate.toLocaleDateString(undefined, options);
      }
    }
    
    // Add completedTimeAgo property
    if (reminder.completed && reminder.completedAt) {
      uiReminder.completedTimeAgo = formatDistanceToNow(reminder.completedAt, { addSuffix: true });
    }
    
    return uiReminder;
  });
};

/**
 * Filter for urgent reminders (due today or overdue)
 */
export const filterUrgentReminders = (reminders: UIEnhancedReminder[]): UIEnhancedReminder[] => {
  const now = new Date();
  return reminders
    .filter(reminder => 
      !reminder.completed && 
      (isToday(reminder.dueDate) || reminder.dueDate < now)
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
};

/**
 * Filter for upcoming reminders (not due today and not overdue)
 */
export const filterUpcomingReminders = (reminders: UIEnhancedReminder[]): UIEnhancedReminder[] => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return reminders
    .filter(reminder => 
      !reminder.completed && 
      !isToday(reminder.dueDate) && 
      reminder.dueDate >= tomorrow
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
};

/**
 * Filter for completed reminders
 */
export const filterCompletedReminders = (reminders: UIEnhancedReminder[]): UIEnhancedReminder[] => {
  return reminders
    .filter(reminder => reminder.completed)
    .sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return b.completedAt.getTime() - a.completedAt.getTime();
    });
};
