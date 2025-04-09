
/**
 * Centralized exports for notification types
 * 
 * This file re-exports all notification types from various modules
 * to provide a single import point.
 * 
 * @module types/notifications
 */

// Re-export all notification types
export * from './notificationHistoryTypes';
export * from './permissionTypes';
export * from './serviceWorkerTypes';
export * from './settingsTypes';
export * from './sharedTypes';
export * from './featureFlags';

// Handle conflicting exports - use more specific names
import { NotificationCleanupConfig as HistoryCleanupConfig } from './notificationHistoryTypes';
import { NotificationCleanupConfig as ServiceWorkerCleanupConfig } from './serviceWorkerTypes';

// Re-export with disambiguated names
export { 
  HistoryCleanupConfig, 
  ServiceWorkerCleanupConfig 
};

// Types re-exported from other modules for convenience
export { NotificationType } from '@/types/reminderTypes';
export type { Reminder } from '@/types/reminderTypes';
