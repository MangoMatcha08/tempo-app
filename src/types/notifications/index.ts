
// Re-export notification types from their respective files
export * from './settingsTypes';
export * from './permissionTypes';
export * from './notificationHistoryTypes';
export * from './serviceWorkerTypes';

// Feature flags for notifications
export const NOTIFICATION_FEATURES = {
  HISTORY_ENABLED: true,
  QUIET_HOURS_ENABLED: false,
  BULK_ACTIONS_ENABLED: false,
  NOTIFICATION_GROUPING: false,
  AUTO_CLEANUP: true
};
