
/**
 * Offline Notification Manager
 * 
 * Manages storing and synchronizing notifications while offline
 */

import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';

// Storage keys
const OFFLINE_NOTIFICATIONS_KEY = 'offline_notifications';
const LAST_SYNC_KEY = 'last_notification_sync';

/**
 * Interface for the background sync registration
 */
interface BackgroundSyncOptions {
  minInterval?: number;
  maxRetries?: number;
}

/**
 * Extended ServiceWorkerRegistration interface
 */
interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register: (tag: string) => Promise<void>;
  };
}

/**
 * Store a notification for offline handling
 */
export const storeOfflineNotification = (notification: NotificationRecord): void => {
  try {
    // Get existing offline notifications
    const existingNotifications = getOfflineNotifications();
    
    // Add new notification (avoid duplicates)
    const updatedNotifications = existingNotifications.find(n => n.id === notification.id)
      ? existingNotifications
      : [...existingNotifications, notification];
    
    // Save to storage
    localStorage.setItem(OFFLINE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
    
    console.log(`Stored notification ${notification.id} for offline handling`);
  } catch (error) {
    console.error('Failed to store offline notification:', error);
  }
};

/**
 * Get all stored offline notifications
 */
export const getOfflineNotifications = (): NotificationRecord[] => {
  try {
    const stored = localStorage.getItem(OFFLINE_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to retrieve offline notifications:', error);
    return [];
  }
};

/**
 * Remove a notification from offline storage
 */
export const removeOfflineNotification = (notificationId: string): void => {
  try {
    const existingNotifications = getOfflineNotifications();
    const updatedNotifications = existingNotifications.filter(n => n.id !== notificationId);
    localStorage.setItem(OFFLINE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
    console.log(`Removed notification ${notificationId} from offline storage`);
  } catch (error) {
    console.error('Failed to remove offline notification:', error);
  }
};

/**
 * Clear all offline notifications
 */
export const clearOfflineNotifications = (): void => {
  try {
    localStorage.removeItem(OFFLINE_NOTIFICATIONS_KEY);
    console.log('Cleared all offline notifications');
  } catch (error) {
    console.error('Failed to clear offline notifications:', error);
  }
};

/**
 * Update last sync timestamp
 */
export const updateLastSync = (): void => {
  try {
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to update last sync timestamp:', error);
  }
};

/**
 * Get last sync timestamp
 */
export const getLastSync = (): number => {
  try {
    const timestamp = localStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp, 10) : 0;
  } catch (error) {
    console.error('Failed to get last sync timestamp:', error);
    return 0;
  }
};

/**
 * Register for background sync if supported
 */
export const registerOfflineSync = async (
  options: BackgroundSyncOptions = {}
): Promise<boolean> => {
  try {
    // Check if the browser supports service workers and background sync
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    const extendedRegistration = registration as ExtendedServiceWorkerRegistration;

    // Check if sync is supported
    if (!extendedRegistration.sync) {
      console.log('Background Sync not supported');
      return false;
    }

    // Register for sync
    await extendedRegistration.sync.register('sync-notifications');
    console.log('Registered for background sync');
    return true;
  } catch (error) {
    console.error('Failed to register for background sync:', error);
    return false;
  }
};

// Export all functions as an object for easier importing
export const offlineNotificationManager = {
  storeOfflineNotification,
  getOfflineNotifications,
  removeOfflineNotification,
  clearOfflineNotifications,
  updateLastSync,
  getLastSync,
  registerOfflineSync
};
