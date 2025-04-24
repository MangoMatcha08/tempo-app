
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
    // Properties from extended types
    completedAt: reminder.completedAt
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
    completedAt: reminder.completedAt,
    createdAt: new Date(),
    userId: "" // This will be filled in by the reminder operations
  };
};

