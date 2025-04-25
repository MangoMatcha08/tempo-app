
import { Reminder as BackendReminder } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";
import { 
  getRemainingTimeDisplay, 
  getTimeAgoDisplay, 
  formatDate,
  ensureValidDate 
} from "./reminder-formatting";
import { cleanReminderData } from "@/utils/reminderValidation";

/**
 * Transforms Firestore data to a properly formatted Reminder object
 * with date fields correctly converted from Firestore Timestamps
 */
export function transformReminder(id: string, data: any): BackendReminder {
  // Clean data to replace undefined with null
  const cleanData = cleanReminderData(data);
  
  // Convert Timestamp to Date for all date fields
  const dueDate = ensureValidDate(cleanData.dueDate);
  const createdAt = cleanData.createdAt ? ensureValidDate(cleanData.createdAt) : new Date();
  const completedAt = cleanData.completedAt ? ensureValidDate(cleanData.completedAt) : null;
  
  return {
    id,
    title: cleanData.title || '',
    description: cleanData.description || '',
    dueDate: dueDate,
    priority: cleanData.priority || 'medium',
    userId: cleanData.userId,
    completed: !!cleanData.completed,
    createdAt: createdAt,
    completedAt: completedAt,
    category: cleanData.category || null,
    checklist: Array.isArray(cleanData.checklist) ? cleanData.checklist.map(item => ({
      id: item.id || crypto.randomUUID(),
      text: item.text || '',
      isCompleted: !!item.isCompleted
    })) : null,
    periodId: cleanData.periodId || null
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
    const cleanReminder = cleanReminderData(reminder);
    const dueDate = ensureValidDate(cleanReminder.dueDate);
    const priority = ensureValidPriority(cleanReminder.priority);
    
    return {
      ...cleanReminder,
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
    const cleanReminder = cleanReminderData(reminder);
    const dueDate = ensureValidDate(cleanReminder.dueDate);
    const priority = ensureValidPriority(cleanReminder.priority);
    
    return {
      ...cleanReminder,
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
    const cleanReminder = cleanReminderData(reminder);
    const dueDate = ensureValidDate(cleanReminder.dueDate);
    const completedAt = cleanReminder.completedAt ? ensureValidDate(cleanReminder.completedAt) : null;
    const priority = ensureValidPriority(cleanReminder.priority);
    
    return {
      ...cleanReminder,
      dueDate,
      completedAt,
      priority,
      completedTimeAgo: completedAt ? getTimeAgoDisplay(completedAt) : '',
      formattedDate: formatDate(dueDate)
    } as UIReminder & { completedTimeAgo: string, formattedDate: string };
  });
}
