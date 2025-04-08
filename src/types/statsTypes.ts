
/**
 * Represents statistics about reminders for the dashboard
 */
export interface ReminderStats {
  total: number;
  completed: number;
  urgent: number;
  upcoming: number;
  overdue: number;
  completionRate: number;
  overdueRate: number;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  categoryBreakdown: Record<string, number>;
  weeklyTrend?: {
    date: string;
    completed: number;
    created: number;
  }[];
}
