
import { Reminder } from "@/types/reminderTypes";
import { formatDistanceToNow, isBefore, isToday, isTomorrow, isYesterday, format } from 'date-fns';

/**
 * Transforms reminders for display, sorting by due date
 */
export const transformReminders = (reminders: Reminder[]): Reminder[] => {
  return [...reminders].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
};

/**
 * Filters reminders that are due soon (within 3 days)
 */
export const filterUrgentReminders = (reminders: Reminder[]): Reminder[] => {
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);
  
  return reminders.filter(reminder => 
    !reminder.completed && 
    new Date(reminder.dueDate) <= threeDaysFromNow
  );
};

/**
 * Filters reminders that are due later (more than 3 days from now)
 */
export const filterUpcomingReminders = (reminders: Reminder[]): Reminder[] => {
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);
  
  return reminders.filter(reminder => 
    !reminder.completed && 
    new Date(reminder.dueDate) > threeDaysFromNow
  );
};

/**
 * Filters completed reminders
 */
export const filterCompletedReminders = (reminders: Reminder[]): Reminder[] => {
  return reminders.filter(reminder => reminder.completed);
};

/**
 * Add formatted time information to reminders
 */
export const enhanceRemindersWithTimeInfo = (reminders: Reminder[]) => {
  return reminders.map(reminder => {
    const dueDate = new Date(reminder.dueDate);
    const now = new Date();
    
    let timeRemaining = '';
    let formattedDate = '';
    
    if (isToday(dueDate)) {
      formattedDate = 'Today';
    } else if (isTomorrow(dueDate)) {
      formattedDate = 'Tomorrow';
    } else if (isYesterday(dueDate)) {
      formattedDate = 'Yesterday';
    } else {
      formattedDate = format(dueDate, 'EEE, MMM d');
    }
    
    if (isBefore(dueDate, now) && !reminder.completed) {
      timeRemaining = `Overdue by ${formatDistanceToNow(dueDate)}`;
    } else if (!reminder.completed) {
      timeRemaining = `Due in ${formatDistanceToNow(dueDate)}`;
    }
    
    let completedTimeAgo = '';
    if (reminder.completed && reminder.completedAt) {
      completedTimeAgo = `Completed ${formatDistanceToNow(new Date(reminder.completedAt))} ago`;
    }
    
    return {
      ...reminder,
      timeRemaining,
      formattedDate,
      completedTimeAgo
    };
  });
};
