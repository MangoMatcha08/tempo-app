
import { Reminder as UIReminder } from "@/types/reminder";
import { Reminder as BackendReminder, ReminderPriority } from "@/types/reminderTypes";

/**
 * Converts a backend reminder to a UI reminder
 */
export const convertToUIReminder = (reminder: BackendReminder): UIReminder => {
  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    dueDate: reminder.dueDate,
    priority: reminder.priority as "low" | "medium" | "high",
    location: reminder.location,
    completed: reminder.completed,
    completedAt: reminder.completedAt,
    createdAt: reminder.createdAt
  };
};

/**
 * Converts a UI reminder to a backend reminder
 */
export const convertToBackendReminder = (reminder: UIReminder): BackendReminder => {
  // Ensure priority is a valid ReminderPriority enum value
  let priority = reminder.priority;
  if (!Object.values(ReminderPriority).includes(priority as ReminderPriority)) {
    console.warn(`Invalid priority value: ${priority}, defaulting to medium`);
    priority = ReminderPriority.MEDIUM;
  }

  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    dueDate: reminder.dueDate,
    priority: priority as ReminderPriority,
    location: reminder.location,
    completed: reminder.completed,
    completedAt: reminder.completedAt,
    createdAt: reminder.createdAt
  };
};

/**
 * Function to ensure a reminder has a valid priority
 */
export const ensureValidPriority = (priority: any): "low" | "medium" | "high" => {
  const validPriorities = ["low", "medium", "high"];
  if (validPriorities.includes(priority)) {
    return priority as "low" | "medium" | "high";
  }
  return "medium";
};
