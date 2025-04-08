
import { NotificationSettings } from "@/types/notifications/settingsTypes";

// Extended notification settings type that includes dailySummary options
export interface ExtendedNotificationSettings extends NotificationSettings {
  email: {
    enabled: boolean;
    address: string;
    minPriority: string;
    dailySummary: {
      enabled: boolean;
      timing: 'before' | 'after';
    }
  }
}
