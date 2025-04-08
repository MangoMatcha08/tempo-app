
import { NotificationSettings } from "@/types/notifications/settingsTypes";
import { ReminderPriority } from "@/types/reminderTypes";

// Extended notification settings type that includes dailySummary options
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
