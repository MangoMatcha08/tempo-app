
import { ReminderPriority, NotificationType } from '@/types/reminderTypes';
import { NotificationChannel } from './settingsTypes';

/**
 * Status of a notification delivery attempt
 */
export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RECEIVED = 'received',
  CLICKED = 'clicked'
}

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
 * Pagination state for notification history
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Notification history state
 */
export interface NotificationHistoryState {
  records: NotificationRecord[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationState;
}

