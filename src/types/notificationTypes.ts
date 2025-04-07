
import { ReminderPriority, NotificationType } from '@/types/reminderTypes';

/**
 * Channel through which notifications can be delivered
 */
export type NotificationChannel = 'email' | 'push' | 'inApp';

/**
 * Status of a notification delivery attempt
 */
export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'received' | 'clicked';

/**
 * Action that can be taken on a notification
 */
export type NotificationAction = 'view' | 'complete' | 'snooze' | 'dismiss';

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
 * Complete user notification settings
 */
export interface NotificationSettings {
  enabled: boolean;
  email: EmailNotificationSettings;
  push: NotificationChannelSettings;
  inApp: NotificationChannelSettings;
}

/**
 * Notification history record
 */
export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  type: NotificationType;
  reminderId?: string;
  priority: ReminderPriority;
  status: NotificationDeliveryStatus;
  channels: NotificationChannel[];
  actions?: Array<{
    type: NotificationAction;
    timestamp: number;
  }>;
}

/**
 * Message payload from service worker to app
 */
export interface ServiceWorkerMessage {
  type: 'NOTIFICATION_CLICKED' | 'NOTIFICATION_CLOSED' | 'NOTIFICATION_ACTION' | 'READY';
  payload?: {
    reminderId?: string;
    action?: NotificationAction;
    notification?: NotificationRecord;
  };
}

/**
 * Message payload from app to service worker
 */
export interface AppMessage {
  type: 'SKIP_WAITING' | 'CLEAR_NOTIFICATIONS' | 'CHECK_PERMISSION';
  payload?: any;
}

/**
 * Response from notification permission request
 */
export interface PermissionRequestResult {
  granted: boolean;
  token?: string | null;
  error?: Error;
}
