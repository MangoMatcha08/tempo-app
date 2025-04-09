
/**
 * Notification Settings Type Definitions
 * 
 * This module contains all type definitions related to notification settings,
 * including channels, preferences, and default values.
 * 
 * @module types/notifications/settingsTypes
 */

import { ReminderPriority } from '@/types/reminderTypes';

/**
 * Notification delivery channels
 * Defines the available communication channels for sending notifications
 * 
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
 * 
 * @interface NotificationSettings
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
  /** Quiet hours settings to prevent notifications during specific times */
  quietHours?: {
    /** Whether quiet hours are enabled */
    enabled: boolean;
    /** Start time in 24-hour format (HH:MM) */
    startTime?: string;
    /** End time in 24-hour format (HH:MM) */
    endTime?: string;
    /** Days of the week (0 = Sunday, 1 = Monday, etc.) */
    daysOfWeek?: number[];
  };
}

/**
 * Default notification settings
 * Used when a user doesn't have custom settings
 * 
 * @const {NotificationSettings}
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
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  }
};
