
/**
 * Notification Actions Hook
 * 
 * Provides functions for interacting with notifications,
 * including handling user actions and service worker messages.
 * 
 * @module hooks/notifications/useNotificationActions
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  NotificationActions,
  NotificationRecord, 
  NotificationAction,
  ServiceWorkerMessage
} from './types';
import { useNotificationHistory } from '@/contexts/notificationHistory';

/**
 * Hook for notification action handling
 * 
 * @returns Action handlers for notifications
 */
export function useNotificationActions(): NotificationActions {
  const navigate = useNavigate();
  const { updateNotificationStatus, addNotificationAction } = useNotificationHistory();
  
  /**
   * Mark a notification as read
   * @param notificationId ID of the notification to mark as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    updateNotificationStatus(notificationId, 'received');
  }, [updateNotificationStatus]);

  /**
   * Mark all notifications as read
   * @param notifications Array of notifications to mark as read
   */
  const markAllAsRead = useCallback((notifications: NotificationRecord[] = []) => {
    notifications.forEach(record => {
      if (record.status !== 'received' && record.status !== 'clicked') {
        updateNotificationStatus(record.id, 'received');
      }
    });
  }, [updateNotificationStatus]);

  /**
   * Handle a notification action
   * @param notificationId ID of the notification
   * @param action The action to perform
   */
  const handleAction = useCallback((notificationId: string, action: NotificationAction) => {
    // Record the action
    addNotificationAction(notificationId, action);
    
    // Update status based on action
    if (action === 'view' || action === 'dismiss') {
      updateNotificationStatus(notificationId, action === 'view' ? 'clicked' : 'received');
    }
  }, [addNotificationAction, updateNotificationStatus]);

  /**
   * Handle messages from the service worker
   * @param message The service worker message
   */
  const handleServiceWorkerMessage = useCallback((message: ServiceWorkerMessage) => {
    console.log('Handling service worker message:', message);
    
    if (message.type === 'NOTIFICATION_ACTION' && message.payload) {
      const { reminderId, action, notification } = message.payload;
      
      if (notification?.id) {
        updateNotificationStatus(notification.id, 'clicked');
      }
      
      if (action === 'view' && reminderId) {
        console.log(`Navigating to reminder ${reminderId}`);
        navigate(`/dashboard/reminders/${reminderId}`);
      }
    }
  }, [updateNotificationStatus, navigate]);

  return {
    markAsRead,
    markAllAsRead,
    handleAction,
    handleServiceWorkerMessage
  };
}
