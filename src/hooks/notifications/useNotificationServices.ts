
/**
 * Notification Services Hook
 * 
 * Provides access to notification-related services like cleanup,
 * testing, and service worker interactions.
 * 
 * @module hooks/notifications/useNotificationServices
 */

import { useCallback } from 'react';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { NotificationServices } from './types';
import { sendTestNotification as sendTestNotificationFn } from '@/lib/firebase/functions';

/**
 * Hook for notification services
 * 
 * @returns Notification service functions
 */
export function useNotificationServices(): NotificationServices {
  const history = useNotificationHistory();
  
  // Forward methods from context
  const {
    cleanupConfig,
    updateCleanupConfig,
    cleanupNotifications,
    runAutomaticCleanup
  } = history;
  
  /**
   * Send a test notification
   * @param options Configuration options for the test notification
   * @returns Promise that resolves when the notification is sent
   */
  const sendTestNotification = useCallback(async (options: { 
    type: "push" | "email"; 
    email?: string; 
    includeDeviceInfo?: boolean 
  }) => {
    try {
      return await sendTestNotificationFn(options);
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }, []);

  return {
    cleanupConfig,
    updateCleanupConfig,
    cleanupNotifications,
    runAutomaticCleanup,
    sendTestNotification
  };
}
