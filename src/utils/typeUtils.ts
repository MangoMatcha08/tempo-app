
import { Reminder as BackendReminder } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";

/**
 * Ensures a priority value is one of the allowed string literal types
 */
export const ensureValidPriority = (priority: string | any): "high" | "medium" | "low" => {
  if (priority === "high" || priority === "medium" || priority === "low") {
    return priority;
  } else if (typeof priority === "string") {
    // Convert any other string to the closest matching priority
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
 * Converts a backend reminder to UI reminder format
 */
export const convertToUIReminder = (reminder: BackendReminder): UIReminder => {
  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description || "",
    dueDate: reminder.dueDate,
    priority: ensureValidPriority(reminder.priority),
    completed: reminder.completed || false,
    completedAt: reminder.completedAt
  };
};

/**
 * Converts a UI reminder to backend reminder format
 */
export const convertToBackendReminder = (reminder: UIReminder): Omit<BackendReminder, "id"> => {
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
