
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
  NotificationPermissionState,
  PermissionRequestResult
} from '@/types/notifications/permissionTypes';

import {
  ServiceWorkerMessage,
  // ServiceWorkerStatus and NotificationActionPayload are not exported from the file
} from '@/types/notifications/serviceWorkerTypes';

// Export all the imported types using 'export type' syntax for isolatedModules compatibility
export type { 
  NotificationSettings,
  NotificationChannel,
  NotificationRecord,
  NotificationDeliveryStatus,
  NotificationAction,
  PaginationState,
  NotificationHistoryState,
  NotificationPermissionState,
  ServiceWorkerMessage,
  PermissionRequestResult
};

