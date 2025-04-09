
/**
 * Notification History Type Definitions
 * 
 * This module contains type definitions related to notification history records,
 * including their statuses and actions.
 * 
 * @module types/notifications/notificationHistoryTypes
 */

import { ReminderPriority } from '@/types/reminderTypes';
import { NotificationType } from '@/types/reminderTypes';
import { NotificationChannel } from '@/types/notifications/settingsTypes';

/**
 * Status of a notification delivery
 */
export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  RECEIVED = 'received',
  CLICKED = 'clicked'
}

/**
 * A record of a notification that has been sent
 */
export interface NotificationRecord {
  /** Unique identifier */
  id: string;
  
  /** Notification title */
  title: string;
  
  /** Notification body */
  body: string;
  
  /** Unix timestamp when the notification was created */
  timestamp: number;
  
  /** Current delivery status */
  status: NotificationDeliveryStatus;
  
  /** Type of notification */
  type: string | NotificationType;
  
  /** Priority level */
  priority: ReminderPriority;
  
  /** Target ID (e.g., reminder ID) */
  reminderId?: string;
  
  /** User ID */
  userId?: string;
  
  /** Delivery channels */
  channels?: NotificationChannel[];
  
  /** Source ID */
  sourceId?: string | null;
  
  /** Source type */
  sourceType?: string | NotificationType;
  
  /** Actions performed on this notification */
  actions?: Array<{
    type: NotificationAction;
    timestamp: number;
  }>;
  
  /** Image URL */
  image?: string | null;
  
  /** Whether notification has been read */
  read?: boolean;
  
  /** When notification was read */
  readAt?: number | null;
  
  /** Deep link to open when clicking the notification */
  deepLink?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Actions that can be performed on notifications
 */
export type NotificationAction = 
  | 'view'      // Open the notification details
  | 'dismiss'   // Dismiss the notification
  | 'complete'  // Mark the associated item as complete
  | 'snooze'    // Snooze the notification for later
  | 'delete';   // Delete the notification permanently

/**
 * Add missing state interfaces
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface NotificationHistoryState {
  records: NotificationRecord[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationState;
}

/**
 * Notification cleanup configuration
 */
export interface NotificationCleanupConfig {
  /** Whether to automatically clean up notifications */
  enabled: boolean;
  
  /** Maximum age of notifications to keep (in days) */
  maxAgeDays: number;
  
  /** Maximum number of notifications to keep */
  maxCount: number;
  
  /** Maximum age in hours (for backward compatibility) */
  maxAge?: number;
  
  /** Whether to exclude high priority notifications from cleanup */
  excludeHighPriority: boolean;
  
  /** Maximum age for high priority notifications (in days) */
  highPriorityMaxAgeDays: number;
  
  /** How often to run cleanup (in hours) */
  cleanupInterval?: number;
  
  /** Timestamp of last cleanup */
  lastCleanup?: number;
}

/**
 * Default notification cleanup configuration
 */
export const defaultCleanupConfig: NotificationCleanupConfig = {
  enabled: true,
  maxAgeDays: 30,
  maxCount: 100,
  excludeHighPriority: true,
  highPriorityMaxAgeDays: 90
};
