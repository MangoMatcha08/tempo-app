
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
import { 
  NotificationServices, 
  NotificationDeliveryManager, 
  NotificationDeliveryResult 
} from '@/types/notifications/sharedTypes';
import { sendTestNotification as sendTestNotificationFn } from '@/lib/firebase/functions';

// Simple implementation of the delivery manager
const createDeliveryManager = (): NotificationDeliveryManager => {
  return {
    deliver: async (notification, channel) => {
      console.log(`Delivering notification via ${channel}:`, notification);
      
      // Simple implementation that always succeeds
      return {
        success: true,
        id: notification.id || `notification-${Date.now()}`,
        channel,
        timestamp: Date.now()
      };
    },
    getBestAvailableMethod: (notification) => {
      // Default to in-app notifications as the fallback
      return 'in-app';
    }
  };
};

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

  // Create delivery manager instance
  const deliveryManager = createDeliveryManager();

  // Create services record
  const services = {
    cleanup: {
      cleanupNotifications,
      runAutomaticCleanup
    },
    testing: {
      sendTestNotification
    }
  };

  return {
    cleanupConfig,
    updateCleanupConfig,
    cleanupNotifications,
    runAutomaticCleanup,
    sendTestNotification,
    deliveryManager,
    services
  };
}
