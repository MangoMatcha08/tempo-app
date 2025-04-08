
import { ReminderPriority } from '@/types/reminderTypes';

/**
 * Notification delivery channels
 * @enum {string}
 */
export enum NotificationChannel {
  /** In-app notifications shown in the application UI */
  IN_APP = 'inApp',
  /** Push notifications delivered via browser or mobile push services */
  PUSH = 'push',
  /** Email notifications sent to user's email address */
  EMAIL = 'email',
  /** SMS notifications sent to user's phone number (not implemented yet) */
  SMS = 'sms'
}

/**
 * Notification settings for a user
 * Controls how and when notifications are sent to the user
 */
export interface NotificationSettings {
  /** Master switch to enable/disable all notifications */
  enabled: boolean;
  /** Email notification settings */
  email: {
    /** Whether email notifications are enabled */
    enabled: boolean;
    /** Email address to send notifications to */
    address: string;
    /** Minimum priority level for sending email notifications */
    minPriority: ReminderPriority;
    /** Daily summary email settings */
    dailySummary?: {
      /** Whether daily summary emails are enabled */
      enabled: boolean;
      /** When to send the daily summary (before or after the school day) */
      timing: 'before' | 'after';
    };
  };
  /** Push notification settings */
  push: {
    /** Whether push notifications are enabled */
    enabled: boolean;
    /** Minimum priority level for sending push notifications */
    minPriority: ReminderPriority;
  };
  /** In-app notification settings */
  inApp: {
    /** Whether in-app notifications are enabled */
    enabled: boolean;
    /** Minimum priority level for showing in-app notifications */
    minPriority: ReminderPriority;
  };
}

// Removed duplicate declaration of NotificationPermissionState as it's now in permissionTypes.ts

/**
 * Default notification settings
 * Used when a user doesn't have custom settings
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
