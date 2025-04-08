
/**
 * Central notification types module
 * 
 * This file serves as the main entry point for all notification-related type definitions.
 * It re-exports types from domain-specific modules to provide a clean, organized API
 * for consuming notification types throughout the application.
 * 
 * @module types/notifications
 */

// Re-export notification types from their respective files
export * from './settingsTypes';
export * from './notificationHistoryTypes';
export * from './permissionTypes';
export * from './serviceWorkerTypes';
export * from './featureFlags';

/**
 * Feature flag constants for notification functionality
 * Controls which notification features are enabled in the application
 */
export const NOTIFICATION_FEATURES = {
  /** Whether notification history is enabled */
  HISTORY_ENABLED: true,
  /** Whether quiet hours functionality is enabled */
  QUIET_HOURS_ENABLED: false,
  /** Whether bulk actions on notifications are enabled */
  BULK_ACTIONS_ENABLED: false,
  /** Whether notification grouping is enabled */
  NOTIFICATION_GROUPING: false,
  /** Whether virtualized lists are used for performance */
  VIRTUALIZED_LISTS: true,
  /** Whether paginated loading is used for notification lists */
  PAGINATED_LOADING: true,
  /** Whether advanced caching is enabled */
  ADVANCED_CACHE: true,
  /** Whether automatic cleanup of old notifications is enabled */
  AUTO_CLEANUP: true
};

// Re-export notification permission context for convenience
import { NotificationPermissionProvider, useNotificationPermission } from '../../contexts/NotificationPermissionContext';
export { NotificationPermissionProvider, useNotificationPermission };
