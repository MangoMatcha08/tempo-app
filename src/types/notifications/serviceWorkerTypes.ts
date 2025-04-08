
import { NotificationRecord } from './notificationHistoryTypes';
import { NotificationAction } from './notificationHistoryTypes';

/**
 * Message payload from service worker to app
 */
export interface ServiceWorkerMessage {
  type: 'NOTIFICATION_CLICKED' | 'NOTIFICATION_CLOSED' | 'NOTIFICATION_ACTION' | 'READY' | 'SYNC_COMPLETE' | 'SYNC_FAILED';
  payload?: {
    reminderId?: string;
    action?: NotificationAction;
    notification?: NotificationRecord;
    success?: boolean;
    error?: string;
    version?: string;
  };
}

/**
 * Message payload from app to service worker
 */
export interface AppMessage {
  type: 'SKIP_WAITING' | 'CLEAR_NOTIFICATIONS' | 'CHECK_PERMISSION' | 'SYNC_REMINDERS' | 'SET_IMPLEMENTATION';
  payload?: {
    useNewImplementation?: boolean;
    reminders?: any[];
    userId?: string;
    [key: string]: any;
  };
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
}

/**
 * Service worker implementation feature flags
 */
export const SERVICE_WORKER_FEATURES = {
  BACKGROUND_SYNC: true,
  NOTIFICATION_GROUPING: true,
  OFFLINE_SUPPORT: true,
  PERIODIC_SYNC: false,
  PUSH_NOTIFICATION_ACTIONS: true
};
