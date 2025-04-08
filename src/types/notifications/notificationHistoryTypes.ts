
import { ReminderPriority, NotificationType } from '@/types/reminderTypes';
import { NotificationChannel } from './settingsTypes';

/**
 * Status of a notification delivery attempt
 * @enum {string}
 */
export enum NotificationDeliveryStatus {
  /** Notification is waiting to be sent */
  PENDING = 'pending',
  /** Notification has been sent but not confirmed received */
  SENT = 'sent',
  /** Notification failed to send */
  FAILED = 'failed',
  /** Notification was received by the user */
  RECEIVED = 'received',
  /** Notification was clicked/opened by the user */
  CLICKED = 'clicked'
}

/**
 * Action that can be taken on a notification
 * @type {string}
 */
export type NotificationAction = 'view' | 'complete' | 'snooze' | 'dismiss';

/**
 * Notification history record
 * Contains all information about a notification that was sent
 */
export interface NotificationRecord {
  /** Unique identifier for the notification */
  id: string;
  /** Notification title */
  title: string;
  /** Notification body/content */
  body: string;
  /** Timestamp when notification was created (milliseconds since epoch) */
  timestamp: number;
  /** Type of notification */
  type: NotificationType;
  /** User ID who received the notification */
  userId?: string;
  /** Associated reminder ID (if applicable) */
  reminderId?: string;
  /** Priority level of the notification */
  priority: ReminderPriority;
  /** Current delivery status */
  status: NotificationDeliveryStatus;
  /** Channels through which this notification was delivered */
  channels: NotificationChannel[];
  /** ID of the source that generated this notification */
  sourceId?: string | null;
  /** Type of source that generated this notification */
  sourceType?: string | NotificationType;
  /** Actions taken on this notification */
  actions?: Array<{
    /** Type of action */
    type: NotificationAction;
    /** When the action was taken (milliseconds since epoch) */
    timestamp: number;
  }>;
  /** URL of an image to show with the notification */
  image?: string | null;
  /** Whether the notification has been read */
  read?: boolean;
  /** When the notification was read (milliseconds since epoch) */
  readAt?: number | null;
  /** Additional data associated with the notification */
  metadata?: Record<string, any>;
}

/**
 * Pagination state for notification history
 */
export interface PaginationState {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Notification history state
 */
export interface NotificationHistoryState {
  /** List of notification records */
  records: NotificationRecord[];
  /** Whether notifications are currently loading */
  loading: boolean;
  /** Any error that occurred while loading notifications */
  error: Error | null;
  /** Pagination state */
  pagination: PaginationState;
}
