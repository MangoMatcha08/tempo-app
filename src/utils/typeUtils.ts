
import { Reminder as BackendReminder } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";

/**
 * Converts a backend reminder to UI reminder format
 */
export const convertToUIReminder = (reminder: BackendReminder): UIReminder => {
  // Ensure priority is one of the allowed string literal types
  let normalizedPriority: "high" | "medium" | "low" = "medium";
  
  if (reminder.priority === "high" || reminder.priority === "medium" || reminder.priority === "low") {
    normalizedPriority = reminder.priority;
  } else if (typeof reminder.priority === "string") {
    // Convert any other string to the closest matching priority
    const priorityStr = reminder.priority.toLowerCase();
    if (priorityStr.includes("high") || priorityStr.includes("urgent")) {
      normalizedPriority = "high";
    } else if (priorityStr.includes("low")) {
      normalizedPriority = "low";
    }
  }
  
  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description || "",
    dueDate: reminder.dueDate,
    priority: normalizedPriority,
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
export const convertToBackendReminder = (reminder: UIReminder): Omit<BackendReminder, "id"> => {
  return {
    title: reminder.title,
    description: reminder.description || "",
    dueDate: reminder.dueDate,
    priority: reminder.priority,
    completed: reminder.completed || false,
    completedAt: reminder.completedAt,
    createdAt: new Date(),
    category: reminder.category,
    periodId: reminder.periodId,
    checklist: reminder.checklist,
    userId: "" // This will be filled in by the reminder operations
  };
};
