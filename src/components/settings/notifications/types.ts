
import { NotificationSettings } from '@/types/notifications/settingsTypes';
import { ReminderPriority } from '@/types/reminderTypes';

// Extended type with all potential settings, including optional ones
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

/**
 * Type-safe path helper for form field access
 * This provides better type checking for nested form fields
 */
export type FormFieldPath = 
  | 'enabled'
  | 'email.enabled'
  | 'email.address'
  | 'email.minPriority'
  | 'email.dailySummary.enabled'
  | 'email.dailySummary.timing'
  | 'push.enabled'
  | 'push.minPriority'
  | 'push.urgentOnly'
  | 'inApp.enabled'
  | 'inApp.minPriority'
  | 'inApp.toast'
  | 'inApp.notificationCenter'
  | 'quietHours.enabled'
  | 'quietHours.startTime'
  | 'quietHours.endTime'
  | `quietHours.daysOfWeek.${number}`;
