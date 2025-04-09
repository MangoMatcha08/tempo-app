
/**
 * Notification hooks index
 * Exports all notification-related hooks for easy importing
 * 
 * @module hooks/notifications
 */

// Export type definitions first
export * from './types';

// Export each hook
export * from './useNotificationPermission';
export * from './useNotificationSettings';
export * from './useNotificationServices';
export * from './useNotificationState';
export * from './useNotificationDisplay';
export * from './useNotificationActions';
export * from './useNotificationFeatures';
export * from './useNotifications';

// Export compatibility types to maintain backward compatibility
export * from '@/types/notifications';

// These will be implemented in Phase 3
// export * from './useNotificationPagination';
