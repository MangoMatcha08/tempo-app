
/**
 * Notification History Type Definitions
 * 
 * This module contains type definitions related to notification history records,
 * including their statuses and actions.
 * 
 * @module types/notifications/notificationHistoryTypes
 */

import { ReminderPriority } from '@/types/reminderTypes';

/**
 * Status of a notification delivery
 */
export type NotificationDeliveryStatus = 
  | 'pending'   // Notification is queued for delivery
  | 'sent'      // Notification has been sent to delivery service
  | 'delivered' // Notification has been delivered to the user
  | 'read'      // User has seen the notification
  | 'failed';   // Notification delivery failed

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
  type: string;
  
  /** Priority level */
  priority: ReminderPriority;
  
  /** Target ID (e.g., reminder ID) */
  targetId?: string;
  
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
 * Notification cleanup configuration
 */
export interface NotificationCleanupConfig {
  /** Whether to automatically clean up notifications */
  enabled: boolean;
  
  /** Maximum age of notifications to keep (in days) */
  maxAgeDays: number;
  
  /** Maximum number of notifications to keep */
  maxCount: number;
  
  /** Whether to exclude high priority notifications from cleanup */
  excludeHighPriority: boolean;
  
  /** Maximum age for high priority notifications (in days) */
  highPriorityMaxAgeDays: number;
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
