
import { BaseReminder, ReminderPriority, ReminderCategory, ChecklistItem } from './reminderTypes';

// For backward compatibility, maintain the same interface structure
// but inherit from our BaseReminder to ensure consistency
export interface Reminder extends BaseReminder {
  // Additional properties that may be needed for UI components
  completedAt?: Date;
  category?: ReminderCategory;
  checklist?: ChecklistItem[];
  location?: string;
}

// Re-export the enum for backward compatibility
export type { ReminderPriority, ReminderCategory, ChecklistItem };
