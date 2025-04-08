
import { Reminder } from "@/types/reminderTypes";

/**
 * Stats for reminders
 */
export interface ReminderStats {
  totalActive: number;
  totalCompleted: number;
  totalReminders: number;
  completionRate: number;
  urgentCount: number;
  upcomingCount: number;
}

/**
 * Calculate reminder stats from filtered reminder lists
 */
export function calculateReminderStats(
  urgentReminders: Reminder[],
  upcomingReminders: Reminder[],
  completedReminders: Reminder[]
): ReminderStats {
  const totalActive = urgentReminders.length + upcomingReminders.length;
  const totalCompleted = completedReminders.length;
  const completionRate = (totalReminders: number) => 
    totalReminders > 0 ? Math.round((totalCompleted / totalReminders) * 100) : 0;
  
  return {
    totalActive,
    totalCompleted,
    totalReminders: totalActive + totalCompleted,
    completionRate: completionRate(totalActive + totalCompleted),
    urgentCount: urgentReminders.length,
    upcomingCount: upcomingReminders.length
  };
}
