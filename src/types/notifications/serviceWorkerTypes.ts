
import { NotificationRecord } from './notificationHistoryTypes';
import { NotificationAction } from './notificationHistoryTypes';

/**
 * Message payload from service worker to app
 */
export interface ServiceWorkerMessage {
  type: 'NOTIFICATION_CLICKED' | 'NOTIFICATION_CLOSED' | 'NOTIFICATION_ACTION' | 'READY';
  payload?: {
    reminderId?: string;
    action?: NotificationAction;
    notification?: NotificationRecord;
  };
}

/**
 * Message payload from app to service worker
 */
export interface AppMessage {
  type: 'SKIP_WAITING' | 'CLEAR_NOTIFICATIONS' | 'CHECK_PERMISSION';
  payload?: any;
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
