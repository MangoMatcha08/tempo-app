
import { DatabaseReminder, ReminderPriority } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";

/**
 * Ensures a priority value is one of the allowed enum values
 */
export const ensureValidPriority = (priority: string | any): ReminderPriority => {
  if (priority === ReminderPriority.HIGH || priority === ReminderPriority.MEDIUM || priority === ReminderPriority.LOW) {
    return priority;
  } else if (typeof priority === "string") {
    // Convert any other string to the closest matching priority
    const priorityStr = priority.toLowerCase();
    if (priorityStr.includes("high") || priorityStr.includes("urgent")) {
      return ReminderPriority.HIGH;
    } else if (priorityStr.includes("low")) {
      return ReminderPriority.LOW;
    }
  }
  return ReminderPriority.MEDIUM; // Default priority
};

/**
 * Normalizes priority values to handle legacy data formats
 * This ensures backward compatibility with older reminder formats
 */
export const normalizePriority = (priority: string | any): string => {
  if (!priority) return ReminderPriority.MEDIUM;
  
  // Handle string priorities case-insensitively
  if (typeof priority === 'string') {
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority.includes('high') || lowerPriority === 'h') {
      return ReminderPriority.HIGH;
    } else if (lowerPriority.includes('low') || lowerPriority === 'l') {
      return ReminderPriority.LOW;
    } else if (lowerPriority.includes('med') || lowerPriority === 'm') {
      return ReminderPriority.MEDIUM;
    }
  }
  
  // Handle numeric priorities (from older versions)
  if (typeof priority === 'number') {
    if (priority >= 3) {
      return ReminderPriority.HIGH;
    } else if (priority <= 1) {
      return ReminderPriority.LOW;
    }
  }
  
  // Return medium as default
  return ReminderPriority.MEDIUM;
};

/**
 * Checks if a reminder has high priority, handling legacy formats
 */
export const isHighPriority = (priority: string | any): boolean => {
  const normalized = normalizePriority(priority);
  return normalized === ReminderPriority.HIGH;
};

/**
 * Checks if a reminder has medium priority, handling legacy formats
 */
export const isMediumPriority = (priority: string | any): boolean => {
  const normalized = normalizePriority(priority);
  return normalized === ReminderPriority.MEDIUM;
};

/**
 * Checks if a reminder has low priority, handling legacy formats
 */
export const isLowPriority = (priority: string | any): boolean => {
  const normalized = normalizePriority(priority);
  return normalized === ReminderPriority.LOW;
};

/**
 * Converts a backend reminder to UI reminder format
 */
export const convertToUIReminder = (reminder: DatabaseReminder): UIReminder => {
  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description || "",
    dueDate: reminder.dueDate,
    priority: reminder.priority,
    completed: reminder.completed || false,
    completedAt: reminder.completedAt,
    category: reminder.category,
    periodId: reminder.periodId,
    checklist: reminder.checklist
  };
};

/**
 * Converts a UI reminder to backend reminder format
 */
export const convertToBackendReminder = (reminder: UIReminder): Omit<DatabaseReminder, "id"> => {
  return {
    title: reminder.title,
    description: reminder.description || "",
    dueDate: reminder.dueDate,
    priority: reminder.priority,
    completed: reminder.completed || false,
    completedAt: reminder.completedAt || null,
    createdAt: new Date(),
    userId: "", // This will be filled in by the reminder operations
    category: reminder.category,
    periodId: reminder.periodId,
    checklist: reminder.checklist
  };
};
