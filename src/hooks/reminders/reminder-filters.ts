
import { useMemo } from "react";
import { Reminder } from "@/types/reminderTypes";

/**
 * Custom hook for filtering reminders with memoization for performance
 * Each filter operation is memoized separately to prevent unnecessary recalculations
 */
export function useReminderFilters(reminders: Reminder[]) {
  // Memoized filter for active reminders
  const activeReminders = useMemo(() => 
    reminders.filter(r => !r.completed), 
    [reminders]
  );
  
  // Memoized filter for urgent reminders (due within 24 hours)
  const urgentReminders = useMemo(() => {
    // Only recalculate if activeReminders has changed
    if (activeReminders.length === 0) return [];
    
    const now = new Date();
    const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return activeReminders.filter(reminder => 
      reminder.dueDate <= tomorrowSameTime
    );
  }, [activeReminders]);
  
  // Memoized filter for upcoming reminders (due after 24 hours)
  const upcomingReminders = useMemo(() => {
    // Only recalculate if activeReminders has changed
    if (activeReminders.length === 0) return [];
    
    const now = new Date();
    const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return activeReminders.filter(reminder => 
      reminder.dueDate > tomorrowSameTime
    );
  }, [activeReminders]);
  
  // Memoized filter for completed reminders
  const completedReminders = useMemo(() => 
    reminders.filter(r => r.completed),
    [reminders]
  );

  // Memoized logging for debugging - only runs when counts change
  useMemo(() => {
    if (reminders.length > 0) {
      console.log(
        `Reminders summary: ${reminders.length} total, ` +
        `${activeReminders.length} active, ` +
        `${urgentReminders.length} urgent, ` +
        `${upcomingReminders.length} upcoming, ` +
        `${completedReminders.length} completed`
      );
    }
  }, [
    reminders.length, 
    activeReminders.length, 
    urgentReminders.length, 
    upcomingReminders.length, 
    completedReminders.length
  ]);

  // Return memoized filtered arrays
  return {
    urgentReminders,
    upcomingReminders,
    completedReminders
  };
}
