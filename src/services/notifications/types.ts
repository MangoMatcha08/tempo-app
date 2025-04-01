
import { ReminderPriority } from '@/types/reminderTypes';

// User notification settings interface
export interface NotificationSettings {
  enabled: boolean;
  email: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority;
    dailySummary?: {
      enabled: boolean;
      timing: 'before' | 'after';
    };
  };
  push: {
    enabled: boolean;
    minPriority: ReminderPriority;
  };
  inApp: {
    enabled: boolean;
    minPriority: ReminderPriority;
  };
}

// Default notification settings
export const defaultNotificationSettings: NotificationSettings = {
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
