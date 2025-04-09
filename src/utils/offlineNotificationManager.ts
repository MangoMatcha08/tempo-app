
/**
 * Offline Notification Manager
 * 
 * Handles storing and synchronizing notifications when device is offline
 * Provides fallback mechanisms for delivering notifications without push
 */

import { 
  NotificationRecord, 
  NotificationDeliveryStatus 
} from '@/types/notifications/notificationHistoryTypes';
import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';

// Storage keys
const OFFLINE_NOTIFICATIONS_KEY = 'offline_notifications';
const LAST_SYNC_KEY = 'last_notification_sync';

/**
 * Store a notification for later delivery when offline
 */
export function storeOfflineNotification(notification: NotificationRecord): void {
  try {
    // Get existing offline notifications
    const existingNotifications = getOfflineNotifications();
    
    // Add new notification
    existingNotifications.push({
      ...notification,
      pendingSince: Date.now(),
      syncAttempts: 0,
      status: NotificationDeliveryStatus.PENDING
    });
    
    // Store back to storage
    localStorage.setItem(OFFLINE_NOTIFICATIONS_KEY, JSON.stringify(existingNotifications));
    
    iosPushLogger.logPushEvent('stored-offline-notification', { 
      id: notification.id, 
      title: notification.title 
    });
  } catch (error) {
    iosPushLogger.logErrorEvent('failed-store-offline-notification', error);
  }
}

/**
 * Get all stored offline notifications
 */
export function getOfflineNotifications(): Array<NotificationRecord & { 
  pendingSince?: number; 
  syncAttempts?: number;
}> {
  try {
    const stored = localStorage.getItem(OFFLINE_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    iosPushLogger.logErrorEvent('failed-get-offline-notifications', error);
    return [];
  }
}

/**
 * Remove a notification from offline storage
 */
export function removeOfflineNotification(id: string): void {
  try {
    const notifications = getOfflineNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    localStorage.setItem(OFFLINE_NOTIFICATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    iosPushLogger.logErrorEvent('failed-remove-offline-notification', error, { id });
  }
}

/**
 * Check if synchronization of notifications is needed
 */
export function isSyncNeeded(): boolean {
  // If there are offline notifications, sync is needed
  const offlineNotifications = getOfflineNotifications();
  if (offlineNotifications.length > 0) {
    return true;
  }
  
  // Check when last sync was performed
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (!lastSync) {
    return true;
  }
  
  // If last sync was more than a day ago, sync is needed
  const lastSyncTime = parseInt(lastSync, 10);
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Date.now() - lastSyncTime > oneDayMs;
}

/**
 * Mark last sync time
 */
export function markLastSync(): void {
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
}

/**
 * Register offline notifications for sync when online
 */
export async function registerOfflineSync(): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-notifications');
      return true;
    } catch (error) {
      iosPushLogger.logErrorEvent('failed-register-sync', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Check if the notification system should use fallback delivery
 * Helpful for scenarios where push notifications are not available
 */
export function shouldUseFallbackDelivery(): boolean {
  // Always use fallback on iOS PWAs
  if (browserDetection.isIOSPWA()) {
    return true;
  }
  
  // Use fallback if push permission denied
  if ('Notification' in window && Notification.permission === 'denied') {
    return true;
  }
  
  // Use fallback if offline
  if (!navigator.onLine) {
    return true;
  }
  
  return false;
}

/**
 * Deliver a notification using fallback mechanism
 * This is used when push notifications are not available
 */
export function deliverFallbackNotification(notification: NotificationRecord): boolean {
  try {
    // Store for delivery when app is next opened
    storeOfflineNotification(notification);
    
    // Mark last delivery time for polling mechanism
    localStorage.setItem('last_fallback_delivery', Date.now().toString());
    
    return true;
  } catch (error) {
    iosPushLogger.logErrorEvent('failed-fallback-delivery', error);
    return false;
  }
}

export const offlineNotificationManager = {
  storeOfflineNotification,
  getOfflineNotifications,
  removeOfflineNotification,
  isSyncNeeded,
  markLastSync,
  registerOfflineSync,
  shouldUseFallbackDelivery,
  deliverFallbackNotification
};

export default offlineNotificationManager;
