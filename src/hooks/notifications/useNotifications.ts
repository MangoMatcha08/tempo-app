
/**
 * Unified Notifications Hook
 * 
 * Combines all notification-related hooks into one
 */

import { useCallback } from 'react';
import { useNotificationDisplay } from './useNotificationDisplay';
import { useNotificationPermission } from '@/contexts/NotificationPermissionContext';
import { Reminder } from '@/types/reminderTypes';
import { NotificationRecord, ServiceWorkerMessage } from './types';

/**
 * Main hook for notifications functionality
 */
export function useNotifications() {
  const display = useNotificationDisplay();
  const permission = useNotificationPermission();
  
  // Show a notification based on a reminder
  const showNotification = useCallback((reminder: Reminder) => {
    display.showNotification(reminder);
  }, [display]);
  
  // Show a toast notification
  const showToastNotification = useCallback((notification: NotificationRecord) => {
    display.showToastNotification(notification);
  }, [display]);
  
  // Handle messages from the service worker
  const handleServiceWorkerMessage = useCallback((message: ServiceWorkerMessage) => {
    console.log('Received service worker message:', message);
    
    if (message.type === 'NOTIFICATION_ACTION' && message.payload) {
      const { notification, action } = message.payload;
      
      if (notification && action && notification.id) {
        display.handleAction(notification.id, action as any);
      }
    }
  }, [display]);
  
  return {
    ...display,
    ...permission,
    showNotification,
    handleServiceWorkerMessage,
    showToastNotification,
  };
}

export default useNotifications;
