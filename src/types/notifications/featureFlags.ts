
/**
 * Feature flag definitions for notification system
 */

// Main feature flag type
export interface FeatureFlags {
  // Core notification features
  HISTORY_ENABLED: boolean;
  QUIET_HOURS_ENABLED: boolean;
  BULK_ACTIONS_ENABLED: boolean;
  NOTIFICATION_GROUPING: boolean;
  AUTO_CLEANUP: boolean;
  
  // Performance optimizations
  VIRTUALIZED_LISTS: boolean;
  PAGINATED_LOADING: boolean;
  ADVANCED_CACHE: boolean;
  
  // Developer features
  DEV_MODE: boolean;
  VERBOSE_LOGGING: boolean;
}

// Default feature flag values in production mode
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core notification features
  HISTORY_ENABLED: true,
  QUIET_HOURS_ENABLED: false,
  BULK_ACTIONS_ENABLED: false,
  NOTIFICATION_GROUPING: false,
  AUTO_CLEANUP: true,
  
  // Performance optimizations
  VIRTUALIZED_LISTS: true,
  PAGINATED_LOADING: true,
  ADVANCED_CACHE: true,
  
  // Developer features
  DEV_MODE: false,
  VERBOSE_LOGGING: false
};

// Storage key for persisted feature flags
export const FEATURE_FLAGS_STORAGE_KEY = 'app_feature_flags';
