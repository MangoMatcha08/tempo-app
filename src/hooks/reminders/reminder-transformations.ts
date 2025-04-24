
import { Reminder as BackendReminder } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";
import { 
  getRemainingTimeDisplay, 
  getTimeAgoDisplay, 
  formatDate,
  ensureValidDate 
} from "./reminder-formatting";

/**
 * Transforms Firestore data to a properly formatted Reminder object
 * with date fields correctly converted from Firestore Timestamps
 */
export function transformReminder(id: string, data: any): BackendReminder {
  // Convert Timestamp to Date for all date fields
  const dueDate = ensureValidDate(data.dueDate);
  const createdAt = data.createdAt ? ensureValidDate(data.createdAt) : new Date();
  const completedAt = data.completedAt ? ensureValidDate(data.completedAt) : undefined;
  
  return {
    id,
    title: data.title || '',
    description: data.description || '',
    dueDate: dueDate,
    priority: data.priority || 'medium',
    userId: data.userId,
    completed: !!data.completed,
    createdAt: createdAt,
    completedAt: completedAt,
    category: data.category || undefined,
    checklist: Array.isArray(data.checklist) ? data.checklist.map(item => ({
      id: item.id || crypto.randomUUID(),
      text: item.text || '',
      isCompleted: !!item.isCompleted
    })) : undefined,
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
    const dueDate = ensureValidDate(reminder.dueDate);
    const priority = ensureValidPriority(reminder.priority);
    
    return {
      ...reminder,
      dueDate,
      priority,
      timeRemaining: getRemainingTimeDisplay(dueDate),
      formattedDate: formatDate(dueDate)
    } as UIReminder & { timeRemaining: string, formattedDate: string };
  });
}

/**
 * Transforms backend reminders to UI reminders with formatted time info
 */
export function transformToUpcomingReminders(reminders: BackendReminder[]): UIReminder[] {
  console.log("Transforming upcoming reminders");
  return reminders.map(reminder => {
    const dueDate = ensureValidDate(reminder.dueDate);
    const priority = ensureValidPriority(reminder.priority);
    
    return {
      ...reminder,
      dueDate,
      priority,
      timeRemaining: getRemainingTimeDisplay(dueDate),
      formattedDate: formatDate(dueDate)
    } as UIReminder & { timeRemaining: string, formattedDate: string };
  });
}

/**
 * Transforms backend reminders to UI reminders with completed time info
 */
export function transformToCompletedReminders(reminders: BackendReminder[]): UIReminder[] {
  console.log("Transforming completed reminders");
  return reminders.map(reminder => {
    const dueDate = ensureValidDate(reminder.dueDate);
    const completedAt = reminder.completedAt ? ensureValidDate(reminder.completedAt) : undefined;
    const priority = ensureValidPriority(reminder.priority);
    
    return {
      ...reminder,
      dueDate,
      completedAt,
      priority,
      completedTimeAgo: completedAt ? getTimeAgoDisplay(completedAt) : '',
      formattedDate: formatDate(dueDate)
    } as UIReminder & { completedTimeAgo: string, formattedDate: string };
  });
}
