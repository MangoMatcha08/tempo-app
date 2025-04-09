
import { NotificationSettings } from '@/types/notifications/settingsTypes';

// Extended type with all potential settings, including optional ones
export interface ExtendedNotificationSettings extends NotificationSettings {
  email: {
    enabled: boolean;
    dailySummary: {
      enabled: boolean;
      timing: 'before' | 'after';
    };
  };
}
