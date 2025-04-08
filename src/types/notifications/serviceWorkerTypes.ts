
import { NotificationRecord } from './notificationHistoryTypes';
import { NotificationAction } from './notificationHistoryTypes';

/**
 * Message payload from service worker to app
 */
export interface ServiceWorkerMessage {
  type: 'NOTIFICATION_CLICKED' | 'NOTIFICATION_CLOSED' | 'NOTIFICATION_ACTION' | 
        'READY' | 'SYNC_COMPLETE' | 'SYNC_FAILED' | 'CACHE_MAINTENANCE_COMPLETE' |
        'CACHE_STATS';
  payload?: {
    reminderId?: string;
    action?: NotificationAction;
    notification?: NotificationRecord;
    success?: boolean;
    error?: string;
    version?: string;
    stats?: CacheStatistics;
    timestamp?: number;
  };
}

/**
 * Message payload from app to service worker
 */
export interface AppMessage {
  type: 'SKIP_WAITING' | 'CLEAR_NOTIFICATIONS' | 'CHECK_PERMISSION' | 
        'SYNC_REMINDERS' | 'SET_IMPLEMENTATION' | 'CACHE_MAINTENANCE' | 
        'UPDATE_CONFIG' | 'CLEAR_CACHE' | 'GET_CACHE_STATS';
  payload?: {
    useNewImplementation?: boolean;
    reminders?: any[];
    userId?: string;
    cacheType?: string;
    config?: {
      cachingEnabled?: boolean;
      cacheMaintenanceInterval?: number;
      debug?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
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
  ADVANCED_CACHING: true
};
