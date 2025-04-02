
import { Reminder } from "@/types/reminderTypes";
import { isSameDay, isToday, isTomorrow, isAfter, startOfDay, endOfDay, addDays } from "date-fns";

interface ReminderStats {
  total: number;
  completed: number;
  pendingToday: number;
  pendingTomorrow: number;
  overdue: number;
  upcoming: number;
  completionRate: number;
}

/**
 * Calculate statistics about reminders collection
 */
export const calculateReminderStats = (reminders: Reminder[]): ReminderStats => {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = startOfDay(addDays(now, 1));
  
  let total = reminders.length;
  let completed = 0;
  let pendingToday = 0;
  let pendingTomorrow = 0;
  let overdue = 0;
  let upcoming = 0;
  
  reminders.forEach(reminder => {
    if (reminder.completed) {
      completed++;
      return;
    }
    
    // Not completed reminders
    if (isToday(reminder.dueDate)) {
      pendingToday++;
    } else if (isTomorrow(reminder.dueDate)) {
      pendingTomorrow++;
    } else if (reminder.dueDate < today) {
      overdue++;
    } else {
      upcoming++;
    }
  });
  
  // Calculate completion rate
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    pendingToday,
    pendingTomorrow,
    overdue,
    upcoming,
    completionRate
  };
};

/**
 * Group reminders by date (today, tomorrow, future, etc.)
 */
export const groupRemindersByDate = (reminders: Reminder[]) => {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = startOfDay(addDays(now, 1));
  
  const todayReminders: Reminder[] = [];
  const tomorrowReminders: Reminder[] = [];
  const futureReminders: Reminder[] = [];
  const overdueReminders: Reminder[] = [];
  
  reminders.forEach(reminder => {
    if (reminder.completed) return;
    
    const reminderDate = startOfDay(reminder.dueDate);
    
    if (isSameDay(reminderDate, today)) {
      todayReminders.push(reminder);
    } else if (isSameDay(reminderDate, tomorrow)) {
      tomorrowReminders.push(reminder);
    } else if (isAfter(reminderDate, tomorrow)) {
      futureReminders.push(reminder);
    } else {
      overdueReminders.push(reminder);
    }
  });
  
  return {
    today: todayReminders,
    tomorrow: tomorrowReminders,
    future: futureReminders,
    overdue: overdueReminders
  };
};
