
/**
 * Feature flag definitions for notification system
 */

/**
 * Main feature flag type for notification-related features
 * @interface
 */
export interface FeatureFlags {
  // Core notification features
  /** Whether notification history is enabled */
  HISTORY_ENABLED: boolean;
  /** Whether quiet hours functionality is enabled */
  QUIET_HOURS_ENABLED: boolean;
  /** Whether bulk actions on notifications are enabled */
  BULK_ACTIONS_ENABLED: boolean;
  /** Whether notification grouping is enabled */
  NOTIFICATION_GROUPING: boolean;
  /** Whether automatic cleanup of old notifications is enabled */
  AUTO_CLEANUP: boolean;
  
  // Performance optimizations
  /** Whether to use virtualized lists for performance */
  VIRTUALIZED_LISTS: boolean;
  /** Whether to use pagination for loading notifications */
  PAGINATED_LOADING: boolean;
  /** Whether to use advanced caching strategies */
  ADVANCED_CACHE: boolean;
  
  // Developer features
  /** Whether developer mode is enabled */
  DEV_MODE: boolean;
  /** Whether to enable verbose logging */
  VERBOSE_LOGGING: boolean;
}

/**
 * Default feature flag values in production mode
 */
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

/**
 * Storage key for persisted feature flags
 */
export const FEATURE_FLAGS_STORAGE_KEY = 'app_feature_flags';
