
import { ReminderPriority, NotificationType } from '@/types/reminderTypes';
import { NotificationChannel } from './settingsTypes';

/**
 * Status of a notification delivery attempt
 */
export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'received' | 'clicked';

/**
 * Action that can be taken on a notification
 */
export type NotificationAction = 'view' | 'complete' | 'snooze' | 'dismiss';

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
 * Notification history state
 */
export interface NotificationHistoryState {
  records: NotificationRecord[];
  loading: boolean;
  error: Error | null;
}
