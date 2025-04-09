
// Re-export all hooks from the notification module
export * from './useNotificationDisplay';
export * from './useNotificationState';
export * from './useNotificationActions';
export * from './useNotificationFeatures';
export * from './types';

// For default imports
import useNotificationDisplay from './useNotificationDisplay';
import useNotificationState from './useNotificationState';
import useNotificationActions from './useNotificationActions';
import useNotificationFeatures from './useNotificationFeatures';

export {
  useNotificationDisplay as default,
  useNotificationState,
  useNotificationActions,
  useNotificationFeatures
};
