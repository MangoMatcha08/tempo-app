
import { CreateReminderInput, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";

/**
 * Cleans object by replacing undefined values with null
 */
export function cleanReminderData<T extends Record<string, any>>(data: T): T {
  const cleaned: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    cleaned[key] = value === undefined ? null : value;
  });
  
  return cleaned as T;
}

/**
 * Validates reminder input data
 */
export function validateReminderInput(input: Partial<CreateReminderInput>): string[] {
  const errors: string[] = [];
  
  if (!input.title?.trim()) {
    errors.push("Title is required");
  }
  
  if (!input.dueDate) {
    errors.push("Due date is required");
  }
  
  if (input.priority && !Object.values(ReminderPriority).includes(input.priority as ReminderPriority)) {
    errors.push("Invalid priority value");
  }
  
  if (input.category && !Object.values(ReminderCategory).includes(input.category as ReminderCategory)) {
    errors.push("Invalid category value");
  }
  
  return errors;
}
