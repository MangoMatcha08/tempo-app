
import { ReminderPriority } from '@/types/reminderTypes';

/**
 * Notification delivery channels
 */
export enum NotificationChannel {
  IN_APP = 'inApp',
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms'
}

/**
 * Notification settings for a user
 */
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

/**
 * Notification permission state
 */
export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

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

