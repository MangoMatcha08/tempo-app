
import { ReminderPriority } from '@/types/reminderTypes';

/**
 * Channel through which notifications can be delivered
 */
export type NotificationChannel = 'email' | 'push' | 'inApp';

/**
 * Settings for each notification channel
 */
export interface NotificationChannelSettings {
  enabled: boolean;
  minPriority: ReminderPriority;
}

/**
 * Email-specific notification settings
 */
export interface EmailNotificationSettings extends NotificationChannelSettings {
  address: string;
  dailySummary?: {
    enabled: boolean;
    timing: 'before' | 'after';
  };
}

/**
 * Push notification specific settings
 */
export interface PushNotificationSettings extends NotificationChannelSettings {
  // Push-specific settings can be added here
}

/**
 * In-app notification specific settings
 */
export interface InAppNotificationSettings extends NotificationChannelSettings {
  // In-app specific settings can be added here
}

/**
 * Complete user notification settings
 */
export interface NotificationSettings {
  enabled: boolean;
  email: EmailNotificationSettings;
  push: PushNotificationSettings;
  inApp: InAppNotificationSettings;
}

/**
 * Default notification settings
 */
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
