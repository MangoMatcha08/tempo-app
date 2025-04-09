
/**
 * Notification hooks index
 * Exports all notification-related hooks for easy importing
 * 
 * @module hooks/notifications
 */

// Export type definitions first (without re-exporting from multiple sources)
export type {
  NotificationRecord,
  NotificationAction,
  NotificationDeliveryStatus,
  NotificationType,
  NotificationChannel,
  NotificationPermission,
  NotificationDisplayOptions,
  ToastOptions,
  NotificationDisplay,
  PaginationInfo,
  NotificationStateInterface,
  NotificationCleanupConfig,
  CleanupResult,
  NotificationState,
  NotificationStateOptions,
  NotificationActions,
  NotificationFeatures,
  NotificationServices,
  NotificationSettingsManagement,
  NotificationsAPI
} from './types';

// Export each hook directly without re-exporting their exports
export { useNotificationPermission } from './useNotificationPermission';
export { useNotificationSettings } from './useNotificationSettings';
export { useNotificationServices } from './useNotificationServices';
export { useNotificationState } from './useNotificationState';
export { useNotificationDisplay, useNotificationToast } from './useNotificationDisplay';
export { useNotificationActions } from './useNotificationActions';
export { useNotificationFeatures } from './useNotificationFeatures';
export { useNotifications } from './useNotifications';

// These will be implemented in Phase 3
// export { useNotificationPagination } from './useNotificationPagination';
