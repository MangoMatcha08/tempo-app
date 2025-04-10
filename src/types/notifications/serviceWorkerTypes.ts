import { NotificationRecord } from './notificationHistoryTypes';
import { NotificationAction } from './notificationHistoryTypes';
import { NotificationCleanupConfig, DEFAULT_CLEANUP_CONFIG } from './sharedTypes';

// Re-export for existing imports
export type { NotificationCleanupConfig };
export { DEFAULT_CLEANUP_CONFIG };

/**
 * Message payload from service worker to app
 * @interface
 */
export interface ServiceWorkerMessage {
  /** Type of message being sent from service worker to app */
  type: 'NOTIFICATION_CLICKED' | 'NOTIFICATION_CLOSED' | 'NOTIFICATION_ACTION' | 
        'READY' | 'SYNC_COMPLETE' | 'SYNC_FAILED' | 'CACHE_MAINTENANCE_COMPLETE' |
        'CACHE_STATS' | 'CLEANUP_COMPLETE';
  /** Additional data associated with the message */
  payload?: {
    /** Associated reminder ID */
    reminderId?: string;
    /** Action taken on the notification */
    action?: NotificationAction;
    /** The notification record */
    notification?: NotificationRecord;
    /** Whether the operation was successful */
    success?: boolean;
    /** Error message if operation failed */
    error?: string;
    /** Service worker version */
    version?: string;
    /** Cache statistics */
    stats?: CacheStatistics;
    /** Timestamp of the operation */
    timestamp?: number;
    /** Statistics from cleanup operation */
    cleanupStats?: CleanupStatistics;
  };
}

/**
 * Message payload from app to service worker
 * @interface
 */
export interface AppMessage {
  /** Type of message being sent from app to service worker */
  type: 'SKIP_WAITING' | 'CLEAR_NOTIFICATIONS' | 'CHECK_PERMISSION' | 
        'SYNC_REMINDERS' | 'SET_IMPLEMENTATION' | 'CACHE_MAINTENANCE' | 
        'UPDATE_CONFIG' | 'CLEAR_CACHE' | 'GET_CACHE_STATS' | 'CLEANUP_NOTIFICATIONS';
  /** Additional data associated with the message */
  payload?: {
    /** Whether to use the new implementation */
    useNewImplementation?: boolean;
    /** Reminders to sync */
    reminders?: any[];
    /** User ID for the operation */
    userId?: string;
    /** Type of cache to operate on */
    cacheType?: string;
    /** Configuration options */
    config?: {
      /** Whether caching is enabled */
      cachingEnabled?: boolean;
      /** Interval for cache maintenance in minutes */
      cacheMaintenanceInterval?: number;
      /** Whether to enable debug logging */
      debug?: boolean;
      /** Cleanup configuration */
      cleanupConfig?: NotificationCleanupConfig;
      /** Any other configuration options */
      [key: string]: any;
    };
    /** Options for cleanup operation */
    cleanupOptions?: NotificationCleanupOptions;
    /** Any other payload properties */
    [key: string]: any;
  };
}

/**
 * Service worker status
 * @type {string}
 */
export type ServiceWorkerStatus = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant' | 'unknown';

/**
 * Notification action payload
 * @interface
 */
export interface NotificationActionPayload {
  /** Action taken on the notification */
  action: NotificationAction;
  /** Associated reminder ID */
  reminderId?: string;
  /** ID of the notification */
  notificationId?: string;
  /** When the action was taken (milliseconds since epoch) */
  timestamp: number;
}

/**
 * Cache statistics returned by the service worker
 * @interface
 */
export interface CacheStatistics {
  /** Service worker version */
  version: string;
  /** Implementation used (legacy or enhanced) */
  implementation: string;
  /** Stats for each cache type */
  caches: {
    /** Stats for a specific cache type */
    [cacheType: string]: {
      /** Size of cache in bytes */
      size: number;
      /** Number of items in cache */
      itemCount: number;
      /** Timestamp of oldest item in cache */
      oldestItem?: number;
      /** Timestamp of newest item in cache */
      newestItem?: number;
    }
  };
  /** Total size of all caches in bytes */
  totalSize: number;
  /** Total items across all caches */
  totalItems: number;
}

/**
 * Firebase messaging payload structure
 * @interface
 */
export interface FirebaseMessagingPayload {
  /** Notification display information */
  notification: {
    /** Notification title */
    title: string;
    /** Notification body/content */
    body: string;
    /** Optional image URL */
    image?: string;
  };
  /** Additional data payload */
  data: {
    /** Custom data fields */
    [key: string]: string;
    /** Associated reminder ID */
    reminderId?: string;
    /** User who should receive the notification */
    userId?: string;
    /** Notification priority */
    priority?: string;
    /** Notification type */
    type?: string;
    /** Timestamp of the notification */
    timestamp?: string;
    /** Deep link to open when clicked */
    deepLink?: string;
    /** Notification tag for grouping */
    tag?: string;
  };
}

/**
 * Service Worker Configuration
 * @interface
 */
export interface ServiceWorkerConfig {
  /** Which implementation to use */
  implementation: 'legacy' | 'enhanced';
  /** Whether to enable background sync */
  enableSync: boolean;
  /** Cache version identifier */
  cacheVersion: string;
  /** Whether to enable debug logging */
  debug: boolean;
  /** Whether caching is enabled */
  cachingEnabled?: boolean;
  /** Interval for cache maintenance in minutes */
  cacheMaintenanceInterval?: number;
  /** Configuration for notification cleanup */
  cleanupConfig?: NotificationCleanupConfig;
}

/**
 * Service worker implementation feature flags
 * Controls which features are available in the service worker
 */
export const SERVICE_WORKER_FEATURES = {
  /** Whether background sync is supported */
  BACKGROUND_SYNC: true,
  /** Whether notification grouping is supported */
  NOTIFICATION_GROUPING: true,
  /** Whether offline support is enabled */
  OFFLINE_SUPPORT: true,
  /** Whether periodic sync is supported (experimental) */
  PERIODIC_SYNC: false,
  /** Whether push notification actions are supported */
  PUSH_NOTIFICATION_ACTIONS: true,
  /** Whether advanced caching is enabled */
  ADVANCED_CACHING: true,
  /** Whether automatic cleanup is enabled */
  AUTO_CLEANUP: true
};

/**
 * Cleanup statistics returned after notification cleanup
 * @interface
 */
export interface CleanupStatistics {
  /** Total number of notifications removed */
  totalRemoved: number;
  /** Number removed due to age */
  byAge: number;
  /** Number removed due to count limit */
  byCount: number;
  /** Number removed due to priority rules */
  byPriority: number;
  /** When cleanup ran (milliseconds since epoch) */
  timestamp: number;
  /** How long cleanup took to execute (milliseconds) */
  executionTime: number;
}

/**
 * Options for manual notification cleanup
 * @interface
 */
export interface NotificationCleanupOptions {
  /** Force cleanup regardless of interval */
  force?: boolean;
  /** Calculate what would be removed but don't remove */
  dryRun?: boolean;
  /** Override default maxAge */
  maxAge?: number;
  /** Override default maxCount */
  maxCount?: number;
}
