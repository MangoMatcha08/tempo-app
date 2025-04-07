
import { ReminderPriority } from '@/types/reminderTypes';
import { NotificationSettings as BaseNotificationSettings } from '@/types/notificationTypes';

// Re-export the notification settings type
export type { BaseNotificationSettings as NotificationSettings };

// Default notification settings
export const defaultNotificationSettings: BaseNotificationSettings = {
  enabled: true,
  email: {
    enabled: true,
    address: '',
    minPriority: ReminderPriority.HIGH,
    dailySummary: {
      enabled: false,
      timing: 'after'
    }
  },
  push: {
    enabled: true,
    minPriority: ReminderPriority.MEDIUM
  },
  inApp: {
    enabled: true,
    minPriority: ReminderPriority.LOW
  }
};
