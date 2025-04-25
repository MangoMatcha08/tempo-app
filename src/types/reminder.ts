
import { BaseReminder, ReminderPriority, ReminderCategory, ChecklistItem } from './reminderTypes';

// For backward compatibility, maintain the same interface structure
// but inherit from our BaseReminder to ensure consistency
export interface Reminder extends BaseReminder {
  completedAt?: Date | null;
}

// Re-export the enum for backward compatibility
export { ReminderPriority };
