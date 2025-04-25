
export interface ReminderStats {
  today: number;
  completed: number;
  overdue: number;
  total: number;
  active: number;
  high: number;
  medium: number;
  low: number;
  totalActive: number;
  totalCompleted: number;
  totalReminders: number;
  completionRate: number;
  urgentCount: number;
  upcomingCount: number;
}

export function calculateReminderStats(
  urgentReminders: Reminder[],
  upcomingReminders: Reminder[],
  completedReminders: Reminder[]
): ReminderStats {
  const totalActive = urgentReminders.length + upcomingReminders.length;
  const totalCompleted = completedReminders.length;
  
  return {
    totalActive,
    totalCompleted,
    totalReminders: totalActive + totalCompleted,
    completionRate: totalActive + totalCompleted > 0 ? 
      Math.round((totalCompleted / (totalActive + totalCompleted)) * 100) : 0,
    urgentCount: urgentReminders.length,
    upcomingCount: upcomingReminders.length,
    today: urgentReminders.length,
    completed: completedReminders.length,
    overdue: 0, // This will be calculated elsewhere
    total: totalActive + totalCompleted,
    active: totalActive,
    high: urgentReminders.length,
    medium: upcomingReminders.filter(r => r.priority === 'medium').length,
    low: upcomingReminders.filter(r => r.priority === 'low').length
  };
}
