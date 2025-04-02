
import { Reminder as BackendReminder } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";
import { ensureValidPriority } from "@/utils/typeUtils";
import { 
  getRemainingTimeDisplay, 
  getTimeAgoDisplay, 
  formatDate 
} from "./reminder-formatting";

/**
 * Transforms backend reminders to UI reminders with formatted time info
 */
export function transformToUrgentReminders(reminders: BackendReminder[]): UIReminder[] {
  console.log("Transforming urgent reminders");
  return reminders.map(reminder => {
    const priority = ensureValidPriority(reminder.priority);
    
    return {
      ...reminder,
      priority,
      timeRemaining: getRemainingTimeDisplay(reminder.dueDate),
      formattedDate: formatDate(reminder.dueDate)
    } as UIReminder & { timeRemaining: string, formattedDate: string };
  });
}

/**
 * Transforms backend reminders to UI reminders with formatted time info
 */
export function transformToUpcomingReminders(reminders: BackendReminder[]): UIReminder[] {
  console.log("Transforming upcoming reminders");
  return reminders.map(reminder => {
    const priority = ensureValidPriority(reminder.priority);
    
    return {
      ...reminder,
      priority,
      timeRemaining: getRemainingTimeDisplay(reminder.dueDate),
      formattedDate: formatDate(reminder.dueDate)
    } as UIReminder & { timeRemaining: string, formattedDate: string };
  });
}

/**
 * Transforms backend reminders to UI reminders with completed time info
 */
export function transformToCompletedReminders(reminders: BackendReminder[]): UIReminder[] {
  console.log("Transforming completed reminders");
  return reminders.map(reminder => {
    const priority = ensureValidPriority(reminder.priority);
    
    return {
      ...reminder,
      priority,
      completedTimeAgo: reminder.completedAt ? getTimeAgoDisplay(reminder.completedAt) : '',
      formattedDate: formatDate(reminder.dueDate)
    } as UIReminder & { completedTimeAgo: string, formattedDate: string };
  });
}
