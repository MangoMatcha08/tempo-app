
import { useNotifications as useNotificationContext, useNotificationHistory } from '@/contexts/NotificationContext';
import { toast } from 'sonner';
import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for enhanced notification functionality
 */
export const useNotifications = () => {
  const { showNotification, handleServiceWorkerMessage } = useNotificationContext();
  const { addNotification, updateNotificationStatus } = useNotificationHistory();
  const navigate = useNavigate();
  
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
  
  return {
    showNotification,
    handleServiceWorkerMessage,
    showToastNotification,
    ...useNotificationHistory()
  };
};

export default useNotifications;
