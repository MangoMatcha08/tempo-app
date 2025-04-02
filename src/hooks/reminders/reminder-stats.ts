
import { Reminder } from "@/types/reminderTypes";

export interface ReminderStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  upcoming: number;
  todayCount: number;
  highPriority: number;
  completionRate: number;
}

/**
 * Calculate statistics for reminders
 */
export const calculateReminderStats = (reminders: Reminder[]): ReminderStats => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const total = reminders.length;
  const completed = reminders.filter(r => r.completed).length;
  const pending = total - completed;
  
  const overdue = reminders.filter(r => 
    !r.completed && 
    new Date(r.dueDate) < today
  ).length;
  
  const upcoming = reminders.filter(r => 
    !r.completed && 
    new Date(r.dueDate) >= tomorrow
  ).length;
  
  const todayCount = reminders.filter(r => 
    !r.completed && 
    new Date(r.dueDate) >= today && 
    new Date(r.dueDate) < tomorrow
  ).length;
  
  const highPriority = reminders.filter(r => 
    !r.completed && 
    r.priority === 'high'
  ).length;
  
  // Calculate completion rate (prevent division by zero)
  const completionRate = total > 0 
    ? (completed / total) * 100 
    : 0;
  
  return {
    total,
    completed,
    pending,
    overdue,
    upcoming,
    todayCount,
    highPriority,
    completionRate
  };
};

// Helper function to calculate today's completion status
export const getTodayCompletionStatus = (reminders: Reminder[]): {
  completed: number;
  total: number;
  percentage: number;
} => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayReminders = reminders.filter(r => 
    new Date(r.dueDate) >= today && 
    new Date(r.dueDate) < tomorrow
  );
  
  const total = todayReminders.length;
  const completed = todayReminders.filter(r => r.completed).length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return {
    completed,
    total,
    percentage
  };
};
