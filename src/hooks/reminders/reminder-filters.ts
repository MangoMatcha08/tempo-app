import { useMemo } from "react";

export function useReminderFilters(reminders: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Avoid re-filtering on every render by using useMemo
  return useMemo(() => {
    // Only process if we have reminders
    if (!reminders || reminders.length === 0) {
      return {
        urgentReminders: [],
        upcomingReminders: [],
        completedReminders: [],
      };
    }
    
    // Split reminders into completed and uncompleted first
    const completedReminders = reminders.filter(r => r.completed);
    
    // Only filter non-completed reminders for the urgent and upcoming categories
    const nonCompletedReminders = reminders.filter(r => !r.completed);
    
    // Urgent reminders - due today and not completed
    const urgentReminders = nonCompletedReminders.filter(reminder => {
      if (!reminder.dueDate) return false;
      
      const dueDate = new Date(reminder.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
    
    // Upcoming reminders - due after today and not completed
    const upcomingReminders = nonCompletedReminders.filter(reminder => {
      if (!reminder.dueDate) return false;
      
      const dueDate = new Date(reminder.dueDate);
      return dueDate >= tomorrow;
    });
    
    return {
      urgentReminders,
      upcomingReminders, 
      completedReminders
    };
  }, [reminders]);
}
