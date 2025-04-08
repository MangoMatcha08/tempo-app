
// Re-export notification types from their respective files
export * from './settingsTypes';
export * from './permissionTypes';
export * from './notificationHistoryTypes';
export * from './serviceWorkerTypes';
export * from './featureFlags';

// Feature flag constants for notification functionality
export const NOTIFICATION_FEATURES = {
  HISTORY_ENABLED: true,
  QUIET_HOURS_ENABLED: false,
  BULK_ACTIONS_ENABLED: false,
  NOTIFICATION_GROUPING: false,
  VIRTUALIZED_LISTS: true,
  PAGINATED_LOADING: true,
  ADVANCED_CACHE: true,
  AUTO_CLEANUP: true
};
