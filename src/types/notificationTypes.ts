
// Re-export all notification types from the new structure
// This maintains backwards compatibility while we migrate

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
  NotificationPermissionState
} from '@/types/notifications/permissionTypes';

import {
  ServiceWorkerMessage,
  ServiceWorkerStatus,
  NotificationActionPayload
} from '@/types/notifications/serviceWorkerTypes';

// Export all the imported types
export {
  NotificationSettings,
  NotificationChannel,
  NotificationRecord,
  NotificationDeliveryStatus,
  NotificationAction,
  PaginationState,
  NotificationHistoryState,
  NotificationPermissionState,
  ServiceWorkerMessage,
  ServiceWorkerStatus,
  NotificationActionPayload
};
