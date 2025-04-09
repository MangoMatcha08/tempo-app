
/**
 * Notification Hooks Entry Point
 * 
 * This file provides a centralized entry point for all notification-related hooks.
 * Use this file to import any notification functionality in your application.
 * 
 * @module hooks/notifications
 */

// Re-export main notification hook and types
export * from './useNotifications';
export * from './types';

// Export specialized hooks for advanced use cases
export * from './useNotificationState';
export * from './useNotificationDisplay';
export * from './useNotificationActions';
export * from './useNotificationPermission';
export * from './useNotificationSettings';
export * from './useNotificationServices';
export * from './useNotificationFeatures';

// Default export the main facade hook
export { useNotifications as default } from './useNotifications';
