
import { useNotifications as useNotificationContext, useNotificationHistory } from '@/contexts/NotificationContext';
import { toast } from 'sonner';
import { NotificationRecord, NotificationAction } from '@/types/notifications/notificationHistoryTypes';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { offlineQueue } from '@/services/offline/offlineQueue';
import { serviceWorkerManager } from '@/services/serviceWorker/serviceWorkerManager';
import { logger } from '@/services/serviceWorker/serviceWorkerLogger';

/**
 * Custom hook for enhanced notification functionality
 */
export const useNotifications = () => {
  const { 
    showNotification, 
    handleServiceWorkerMessage, 
    serviceWorkerSupported, 
    isOffline,
    offlineQueueSize,
    refreshOfflineQueueSize
  } = useNotificationContext();
  const { addNotification, updateNotificationStatus } = useNotificationHistory();
  const navigate = useNavigate();
  const [processingAction, setProcessingAction] = useState(false);
  
  /**
   * Show a toast notification with actions
   */
  const showToastNotification = useCallback((notification: NotificationRecord) => {
    // Mark notification as displayed
    updateNotificationStatus(notification.id, 'sent');
    
    // Display toast with Sonner
    toast(
      notification.title,
      {
        id: notification.id,
        description: notification.body,
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            // Handle action
            updateNotificationStatus(notification.id, 'clicked');
            
            // Navigate to reminder if ID exists
            if (notification.reminderId) {
              navigate(`/dashboard/reminders/${notification.reminderId}`);
            }
          }
        },
        onDismiss: () => {
          // Mark as received when dismissed
          updateNotificationStatus(notification.id, 'received');
        },
        onAutoClose: () => {
          // Mark as received when auto-closed
          updateNotificationStatus(notification.id, 'received');
        }
      }
    );
  }, [updateNotificationStatus, navigate]);
  
  /**
   * Handle notification action with offline support
   */
  const handleNotificationAction = useCallback(async (
    action: NotificationAction,
    reminderId: string,
    additionalData: any = {}
  ): Promise<boolean> => {
    try {
      setProcessingAction(true);
      
      // If service worker is supported, use it
      if (serviceWorkerSupported) {
        logger.info(`Handling ${action} action for reminder ${reminderId}`);
        
        // If offline, queue the action
        if (isOffline) {
          const queueId = await offlineQueue.addToQueue(action, reminderId, additionalData);
          
          if (queueId) {
            logger.info(`Added ${action} action to offline queue with ID ${queueId}`);
            
            // Refresh queue size
            refreshOfflineQueueSize();
            
            // Show toast notification
            toast({
              title: 'Offline Action Queued',
              description: `Your ${action} action will be processed when you're back online.`,
              duration: 3000
            });
            
            return true;
          } else {
            logger.error(`Failed to add ${action} action to offline queue`);
            return false;
          }
        } else {
          // Online - send action directly to service worker
          const success = await serviceWorkerManager.sendNotificationAction(
            action,
            reminderId,
            additionalData
          );
          
          if (success) {
            logger.info(`Successfully sent ${action} action for reminder ${reminderId}`);
          } else {
            logger.warn(`Failed to send ${action} action for reminder ${reminderId}`);
          }
          
          return success;
        }
      } else {
        // Service worker not supported, handle action directly
        logger.info(`Service worker not supported, handling ${action} action directly`);
        
        // Implement direct handling logic here
        // This is a fallback for browsers without service worker support
        
        return true;
      }
    } catch (error) {
      logger.error(`Error handling ${action} action for reminder ${reminderId}`, error);
      return false;
    } finally {
      setProcessingAction(false);
    }
  }, [serviceWorkerSupported, isOffline, refreshOfflineQueueSize]);
  
  /**
   * Get offline queue items
   */
  const getOfflineQueueItems = useCallback(async () => {
    try {
      return await offlineQueue.getAll();
    } catch (error) {
      logger.error('Error getting offline queue items', error);
      return [];
    }
  }, []);
  
  /**
   * Clear offline queue
   */
  const clearOfflineQueue = useCallback(async () => {
    try {
      const success = await offlineQueue.clearQueue();
      
      if (success) {
        refreshOfflineQueueSize();
      }
      
      return success;
    } catch (error) {
      logger.error('Error clearing offline queue', error);
      return false;
    }
  }, [refreshOfflineQueueSize]);
  
  return {
    showNotification,
    handleServiceWorkerMessage,
    showToastNotification,
    handleNotificationAction,
    serviceWorkerSupported,
    isOffline,
    offlineQueueSize,
    refreshOfflineQueueSize,
    getOfflineQueueItems,
    clearOfflineQueue,
    processingAction,
    ...useNotificationHistory()
  };
};

export default useNotifications;
