
import { NotificationRecord } from './notificationHistoryTypes';
import { NotificationAction } from './notificationHistoryTypes';

/**
 * Message payload from service worker to app
 */
export interface ServiceWorkerMessage {
  type: 'NOTIFICATION_CLICKED' | 'NOTIFICATION_CLOSED' | 'NOTIFICATION_ACTION' | 
        'READY' | 'SYNC_COMPLETE' | 'SYNC_FAILED' | 'CACHE_MAINTENANCE_COMPLETE' |
        'CACHE_STATS' | 'CLEANUP_COMPLETE';
  payload?: {
    reminderId?: string;
    action?: NotificationAction;
    notification?: NotificationRecord;
    success?: boolean;
    error?: string;
    version?: string;
    stats?: CacheStatistics;
    timestamp?: number;
    cleanupStats?: CleanupStatistics;
  };
}

/**
 * Message payload from app to service worker
 */
export interface AppMessage {
  type: 'SKIP_WAITING' | 'CLEAR_NOTIFICATIONS' | 'CHECK_PERMISSION' | 
        'SYNC_REMINDERS' | 'SET_IMPLEMENTATION' | 'CACHE_MAINTENANCE' | 
        'UPDATE_CONFIG' | 'CLEAR_CACHE' | 'GET_CACHE_STATS' | 'CLEANUP_NOTIFICATIONS';
  payload?: {
    useNewImplementation?: boolean;
    reminders?: any[];
    userId?: string;
    cacheType?: string;
    config?: {
      cachingEnabled?: boolean;
      cacheMaintenanceInterval?: number;
      debug?: boolean;
      cleanupConfig?: NotificationCleanupConfig;
      [key: string]: any;
    };
    cleanupOptions?: NotificationCleanupOptions;
    [key: string]: any;
  };
}

/**
 * Service worker status
 */
export type ServiceWorkerStatus = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant' | 'unknown';

/**
 * Notification action payload
 */
export interface NotificationActionPayload {
  action: NotificationAction;
  reminderId?: string;
  notificationId?: string;
  timestamp: number;
}

/**
 * Cache statistics returned by the service worker
 */
export interface CacheStatistics {
  version: string;
  implementation: string;
  caches: {
    [cacheType: string]: {
      size: number;
      itemCount: number;
      oldestItem?: number;
      newestItem?: number;
    }
  };
  totalSize: number;
  totalItems: number;
}

/**
 * Firebase messaging payload structure
 */
export interface FirebaseMessagingPayload {
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data: {
    [key: string]: string;
    reminderId?: string;
    userId?: string;
    priority?: string;
    type?: string;
    timestamp?: string;
    deepLink?: string;
    tag?: string;
  };
}

/**
 * Service Worker Configuration
 */
export interface ServiceWorkerConfig {
  implementation: 'legacy' | 'enhanced';
  enableSync: boolean;
  cacheVersion: string;
  debug: boolean;
  cachingEnabled?: boolean;
  cacheMaintenanceInterval?: number;
  cleanupConfig?: NotificationCleanupConfig;
}

/**
 * Service worker implementation feature flags
 */
export const SERVICE_WORKER_FEATURES = {
  BACKGROUND_SYNC: true,
  NOTIFICATION_GROUPING: true,
  OFFLINE_SUPPORT: true,
  PERIODIC_SYNC: false,
  PUSH_NOTIFICATION_ACTIONS: true,
  ADVANCED_CACHING: true,
  AUTO_CLEANUP: true
};

/**
 * Cleanup statistics returned after notification cleanup
 */
export interface CleanupStatistics {
  totalRemoved: number;
  byAge: number;
  byCount: number;
  byPriority: number;
  timestamp: number;
  executionTime: number;
}

/**
 * Configuration for automatic notification cleanup
 */
export interface NotificationCleanupConfig {
  enabled: boolean;
  maxAge: number;         // in days
  maxCount: number;       // max number of notifications to keep
  keepHighPriority: boolean;
  highPriorityMaxAge: number; // in days
  cleanupInterval: number; // in hours
  lastCleanup?: number;   // timestamp
}

/**
 * Default cleanup configuration
 */
export const DEFAULT_CLEANUP_CONFIG: NotificationCleanupConfig = {
  enabled: true,
  maxAge: 30,            // 30 days
  maxCount: 200,         // Keep last 200 notifications
  keepHighPriority: true,
  highPriorityMaxAge: 90, // 90 days for high priority
  cleanupInterval: 24,    // Run cleanup daily
};

/**
 * Options for manual notification cleanup
 */
export interface NotificationCleanupOptions {
  force?: boolean;       // Force cleanup regardless of interval
  dryRun?: boolean;      // Calculate what would be removed but don't remove
  maxAge?: number;       // Override default maxAge
  maxCount?: number;     // Override default maxCount
}
