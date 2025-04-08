
/**
 * Central re-export file for notification types
 * 
 * This file maintains backwards compatibility while we migrate
 * to the new notification type structure. It re-exports types
 * from the new structure so existing code doesn't break.
 */

// Import and re-export specific types to avoid conflicts
import { 
  NotificationSettings,
  NotificationChannel,
  // Do not re-export NotificationPermissionState here to avoid duplicates
} from '@/types/notifications/settingsTypes';

import {
  NotificationRecord,
  NotificationDeliveryStatus,
  NotificationAction,
  PaginationState,
  NotificationHistoryState
} from '@/types/notifications/notificationHistoryTypes';

import {
  NotificationPermissionState,
  PermissionRequestResult
} from '@/types/notifications/permissionTypes';

import {
  ServiceWorkerMessage,
  AppMessage,
  // ServiceWorkerStatus and NotificationActionPayload are not exported from this file
  // to avoid cluttering the global namespace
} from '@/types/notifications/serviceWorkerTypes';

/**
 * Export all the imported types using 'export type' syntax for isolatedModules compatibility
 */
export type { 
  /** User notification preferences */
  NotificationSettings,
  /** Available notification delivery channels */
  NotificationChannel,
  /** Record of a sent notification */
  NotificationRecord,
  /** Status of a notification delivery attempt */
  NotificationDeliveryStatus,
  /** Action that can be taken on a notification */
  NotificationAction,
  /** Pagination state for notification lists */
  PaginationState,
  /** State of the notification history */
  NotificationHistoryState,
  /** Browser notification permission state */
  NotificationPermissionState,
  /** Message from service worker to app */
  ServiceWorkerMessage,
  /** Message from app to service worker */
  AppMessage,
  /** Result of a permission request */
  PermissionRequestResult
};
