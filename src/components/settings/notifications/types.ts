
import { NotificationSettings } from "@/services/notificationService";
import { ReminderPriority } from "@/types/reminderTypes";

// Extended notification settings to include daily summary options
export interface ExtendedNotificationSettings extends NotificationSettings {
  email: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority;
    dailySummary: {
      enabled: boolean;
      timing: 'before' | 'after';
    };
  };
}
