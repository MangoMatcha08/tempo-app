
import { useMemo } from "react";
import { Reminder } from "@/types/reminderTypes";

// Simple cache for performance optimization
const filterCache = {
  lastInput: [] as Reminder[],
  active: [] as Reminder[],
  urgent: [] as Reminder[],
  upcoming: [] as Reminder[],
  completed: [] as Reminder[]
};

/**
 * Custom hook for filtering reminders with memoization for performance
 * Each filter operation is memoized separately to prevent unnecessary recalculations
 */
export function useReminderFilters(reminders: Reminder[]) {
  // Check if we can use cached results
  const canUseCache = reminders === filterCache.lastInput && 
                      filterCache.lastInput.length > 0;
  
  // Memoized filter for active reminders
  const activeReminders = useMemo(() => {
    if (canUseCache) return filterCache.active;
    
    const result = reminders.filter(r => !r.completed);
    // Update cache
    filterCache.active = result;
    return result;
  }, [reminders, canUseCache]);
  
  // Memoized filter for urgent reminders (due within 24 hours)
  const urgentReminders = useMemo(() => {
    if (canUseCache) return filterCache.urgent;
    
    // Only recalculate if activeReminders has changed
    if (activeReminders.length === 0) return [];
    
    const now = new Date();
    const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const result = activeReminders.filter(reminder => 
      reminder.dueDate <= tomorrowSameTime
    );
    
    // Update cache
    filterCache.urgent = result;
    return result;
  }, [activeReminders, canUseCache]);
  
  // Memoized filter for upcoming reminders (due after 24 hours)
  const upcomingReminders = useMemo(() => {
    if (canUseCache) return filterCache.upcoming;
    
    // Only recalculate if activeReminders has changed
    if (activeReminders.length === 0) return [];
    
    const now = new Date();
    const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const result = activeReminders.filter(reminder => 
      reminder.dueDate > tomorrowSameTime
    );
    
    // Update cache
    filterCache.upcoming = result;
    return result;
  }, [activeReminders, canUseCache]);
  
  // Memoized filter for completed reminders
  const completedReminders = useMemo(() => {
    if (canUseCache) return filterCache.completed;
    
    const result = reminders.filter(r => r.completed);
    // Update cache
    filterCache.completed = result;
    return result;
  }, [reminders, canUseCache]);

  // Memoized logging for debugging - only runs when counts change
  useMemo(() => {
    if (reminders.length > 0) {
      // Update lastInput in cache
      filterCache.lastInput = reminders;
      
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
