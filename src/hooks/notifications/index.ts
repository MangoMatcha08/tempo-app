
// Re-export all hooks from the notification module
export * from './useNotificationDisplay';
export * from './useNotificationState';
export * from './useNotificationActions';
export * from './useNotificationFeatures';
export * from './types';

// Add missing hooks exports
export * from './useNotificationPermission';
export * from './useNotificationSettings';
export * from './useNotificationServices';
export * from './useNotifications';

// For default imports
import useNotificationDisplay from './useNotificationDisplay';
import { useNotificationState } from './useNotificationState';
import { useNotificationActions } from './useNotificationActions';
import useNotificationFeatures from './useNotificationFeatures';
// Add missing imports
import { useNotificationPermission } from './useNotificationPermission';
import { useNotificationSettings } from './useNotificationSettings';
import { useNotificationServices } from './useNotificationServices';
import { useNotifications } from './useNotifications';

export {
  useNotificationDisplay as default,
  useNotificationState,
  useNotificationActions,
  useNotificationFeatures,
  // Add missing exports
  useNotificationPermission,
  useNotificationSettings,
  useNotificationServices,
  useNotifications
};
