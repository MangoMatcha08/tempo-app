import { Reminder as BackendReminder } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";
import { 
  getRemainingTimeDisplay, 
  getTimeAgoDisplay, 
  formatDate 
} from "./reminder-formatting";

// Add the new transformReminder function
export function transformReminder(id: string, data: any): BackendReminder {
  return {
    id,
    title: data.title || '',
    description: data.description || '',
    dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
    priority: data.priority || 'medium',
    userId: data.userId,
    completed: data.completed || false,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    category: data.category,
    checklist: data.checklist,
    periodId: data.periodId
  };
}

/**
 * Ensures a priority value is one of the allowed string literal types
 */
const ensureValidPriority = (priority: string | any): "high" | "medium" | "low" => {
  if (priority === "high" || priority === "medium" || priority === "low") {
    return priority;
  } else if (typeof priority === "string") {
    const priorityStr = priority.toLowerCase();
    if (priorityStr.includes("high") || priorityStr.includes("urgent")) {
      return "high";
    } else if (priorityStr.includes("low")) {
      return "low";
    }
  }
  return "medium"; // Default priority
};

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
