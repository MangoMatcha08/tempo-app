
import { Timestamp } from "firebase/firestore";
import { Reminder, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";

/**
 * Type guard for Firestore Timestamp objects
 */
export function isTimestamp(value: any): value is Timestamp {
  return value && typeof value === 'object' && 'toDate' in value;
}

/**
 * Type guard for Date objects
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard for Reminder objects
 */
export function isReminder(value: any): value is Reminder {
  return (
    value &&
    typeof value === 'object' &&
    'title' in value &&
    'description' in value &&
    'dueDate' in value
  );
}

/**
 * Validates reminder priority
 */
export function isValidPriority(value: any): value is ReminderPriority {
  return Object.values(ReminderPriority).includes(value as ReminderPriority);
}

/**
 * Validates reminder category
 */
export function isValidCategory(value: any): value is ReminderCategory {
  return Object.values(ReminderCategory).includes(value as ReminderCategory);
}
