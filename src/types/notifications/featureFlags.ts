
/**
 * Feature Flag Type Definitions
 * 
 * This module defines feature flags for the notification system
 */

/**
 * Feature flag configuration
 */
export interface FeatureFlags {
  // Core notification features
  HISTORY_ENABLED: boolean;
  QUIET_HOURS_ENABLED: boolean;
  BULK_ACTIONS_ENABLED: boolean;
  NOTIFICATION_GROUPING: boolean;
  
  // Performance & reliability features
  AUTO_CLEANUP: boolean;
  VIRTUALIZED_LISTS: boolean;
  PAGINATED_LOADING: boolean;
  ADVANCED_CACHE: boolean;
  
  // iOS-specific features
  IOS_PWA_FALLBACK: boolean;
  IOS_PUSH_SUPPORT: boolean;
  
  // Offline & sync features
  BACKGROUND_SYNC: boolean;
  OFFLINE_NOTIFICATIONS: boolean;
  SHOW_SYNC_NOTIFICATIONS: boolean;
  
  // Developer features
  DEV_MODE: boolean;
  VERBOSE_LOGGING: boolean;
  
  // Set a version rollout value based on iOS version for targeted features
  IOS_VERSION_ROLLOUT: number;
}

/**
 * Default feature flag values
 */
export const NOTIFICATION_FEATURES: FeatureFlags = {
  // Core features - generally enabled
  HISTORY_ENABLED: true,
  QUIET_HOURS_ENABLED: true,
  BULK_ACTIONS_ENABLED: true,
  NOTIFICATION_GROUPING: true,
  
  // Performance features - enabled by default
  AUTO_CLEANUP: true,
  VIRTUALIZED_LISTS: true,
  PAGINATED_LOADING: true,
  ADVANCED_CACHE: true,
  
  // iOS-specific features - enabled based on detection
  IOS_PWA_FALLBACK: true,
  IOS_PUSH_SUPPORT: true,
  
  // Offline & sync features - enabled by default
  BACKGROUND_SYNC: true,
  OFFLINE_NOTIFICATIONS: true,
  SHOW_SYNC_NOTIFICATIONS: true,
  
  // Developer features - disabled by default
  DEV_MODE: false,
  VERBOSE_LOGGING: false,
  
  // iOS version rollout - defaults to 0 (no restriction)
  IOS_VERSION_ROLLOUT: 0
};
