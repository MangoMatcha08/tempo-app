
/**
 * Centralized exports for notification types
 * 
 * This file re-exports all notification types from various modules
 * to provide a single import point.
 * 
 * @module types/notifications
 */

// Re-export from sharedTypes (the source of truth for shared types)
export { 
  type BaseNotificationPayload,
  type PermissionRequestResult,
  type ServiceWorkerMessage,
  type NotificationCleanupConfig,
  DEFAULT_CLEANUP_CONFIG
} from './sharedTypes';

// Re-export other module-specific types
export * from './notificationHistoryTypes';
export * from './permissionTypes';
export * from './serviceWorkerTypes';
export * from './settingsTypes';
export * from './featureFlags';

// Re-export types from other modules for convenience
export type { NotificationType } from '@/types/reminderTypes';
export type { Reminder } from '@/types/reminderTypes';

