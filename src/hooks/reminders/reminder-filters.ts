
import { useMemo } from "react";
import { Reminder } from "@/types/reminderTypes";

export function useReminderFilters(reminders: Reminder[]) {
  // Filter reminders into categories
  const activeReminders = useMemo(() => 
    reminders.filter(r => !r.completed), 
    [reminders]
  );
  
  const urgentReminders = useMemo(() => 
    activeReminders.filter(reminder => {
      const now = new Date();
      const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return reminder.dueDate <= tomorrowSameTime;
    }),
    [activeReminders]
  );
  
  const upcomingReminders = useMemo(() => 
    activeReminders.filter(reminder => {
      const now = new Date();
      const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return reminder.dueDate > tomorrowSameTime;
    }),
    [activeReminders]
  );
  
  const completedReminders = useMemo(() => 
    reminders.filter(r => r.completed),
    [reminders]
  );

  // Log summary for debugging
  useMemo(() => {
    if (reminders.length > 0) {
      console.log(`Reminders summary: ${reminders.length} total, ${activeReminders.length} active, ${urgentReminders.length} urgent, ${upcomingReminders.length} upcoming, ${completedReminders.length} completed`);
    }
  }, [reminders.length, activeReminders.length, urgentReminders.length, upcomingReminders.length, completedReminders.length]);

  return {
    urgentReminders,
    upcomingReminders,
    completedReminders
  };
}
