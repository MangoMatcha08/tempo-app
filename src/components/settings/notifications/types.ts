
/**
 * Extended notification settings types for the settings UI
 * 
 * @module components/settings/notifications/types
 */

import { NotificationSettings } from "@/types/notifications";
import { ReminderPriority } from "@/types/reminderTypes";

/**
 * Extended notification settings type that includes dailySummary options
 * Used specifically in the settings UI components
 * 
 * @interface ExtendedNotificationSettings
 * @extends NotificationSettings
 */
export interface ExtendedNotificationSettings extends NotificationSettings {
  email: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority;
    dailySummary: {
      enabled: boolean;
      timing: 'before' | 'after';
    }
  }
}
