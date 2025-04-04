
import { BaseReminder, ReminderPriority } from './reminderTypes';

// For backward compatibility, maintain the same interface structure
// but inherit from our BaseReminder to ensure consistency
export interface Reminder extends BaseReminder {
  // Any legacy-specific properties can be defined here
  // but we're inheriting the core properties from BaseReminder
}

// Re-export the enum for backward compatibility
export { ReminderPriority };
