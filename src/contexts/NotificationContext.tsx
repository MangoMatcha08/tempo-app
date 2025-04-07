
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Reminder } from '@/types/reminderTypes';
import { 
  showNotification, 
  formatReminderForNotification 
} from '@/utils/notificationUtils';
import { NotificationSettingsProvider, useNotificationSettings } from './NotificationSettingsContext';
import { NotificationPermissionProvider, useNotificationPermission } from './NotificationPermissionContext';
import { NotificationHistoryProvider, useNotificationHistory } from './NotificationHistoryContext';
import { setupForegroundMessageListener } from '@/services/messaging/messagingService';
import { ServiceWorkerMessage } from '@/types/notifications/serviceWorkerTypes';
import { ToastAction } from '@/components/ui/toast';
import { NotificationType } from '@/types/reminderTypes';

// Create a combined notification context
interface NotificationContextType {
  showNotification: (reminder: Reminder) => void;
  handleServiceWorkerMessage: (message: ServiceWorkerMessage) => void;
}

const NotificationContext = React.createContext<NotificationContextType>({
  showNotification: () => {},
  handleServiceWorkerMessage: () => {}
});

export const useNotifications = () => React.useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

// This is the main provider that combines all notification-related providers
const NotificationProviderInner: React.FC<NotificationProviderProps> = ({ children }) => {
  const { settings } = useNotificationSettings();
  const { permissionGranted, isSupported, requestPermission } = useNotificationPermission();
  const { addNotification, updateNotificationStatus } = useNotificationHistory();
  const { toast } = useToast();

  // Setup foreground message listener
  React.useEffect(() => {
    // Setup foreground message listener if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      const unsubscribe = setupForegroundMessageListener((payload) => {
        console.log('Received foreground message:', payload);
        
        // Extract notification data
        const notification = payload.notification;
        const data = payload.data || {};
        
        // Show toast notification for foreground messages
        toast({
          title: notification?.title || 'New Reminder',
          description: notification?.body || 'You have a new reminder',
          duration: 5000,
          variant: data.priority === 'high' ? 'destructive' : 'default',
          action: data.reminderId && data.reminderId !== 'test-reminder' ? (
            <ToastAction
              altText="View reminder"
              onClick={() => {
                // Navigate to the reminder detail view
                if (typeof window !== 'undefined') {
                  window.location.href = `/dashboard/reminders/${data.reminderId}`;
                }
              }}
            >
              View
            </ToastAction>
          ) : undefined
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [toast]);

  // Add service worker message handler
  React.useEffect(() => {
    const handleMessageEvent = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        const message = event.data as ServiceWorkerMessage;
        if (message.type === 'NOTIFICATION_ACTION') {
          handleServiceWorkerMessage(message);
        }
      }
    };

    // Add event listener for service worker messages
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessageEvent);
    }

    return () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessageEvent);
      }
    };
  }, []);

  // Wrapper for showNotification utility
  const handleShowNotification = (reminder: Reminder) => {
    showNotification(reminder, settings, toast);
    
    // Add to notification history if enabled
    const formattedNotification = formatReminderForNotification(reminder);
    if (formattedNotification) {
      addNotification({
        id: `reminder-${reminder.id}-${Date.now()}`,
        title: formattedNotification.title,
        body: formattedNotification.description || '',
        timestamp: Date.now(),
        // Use NotificationType.TEST as default, which is a valid NotificationType value
        type: NotificationType.TEST,
        reminderId: reminder.id,
        priority: reminder.priority,
        status: 'sent',
        channels: ['inApp']
      });
    }
  };

  // Handle service worker messages
  const handleServiceWorkerMessage = (message: ServiceWorkerMessage) => {
    console.log('Handling service worker message:', message);
    
    if (message.type === 'NOTIFICATION_ACTION' && message.payload) {
      const { reminderId, action, notification } = message.payload;
      
      // Update notification status if we have notification info
      if (notification?.id) {
        updateNotificationStatus(notification.id, 'clicked');
      }
      
      // Handle different actions
      if (action && reminderId) {
        // This will be implemented in Phase 2B
        console.log(`Handling ${action} action for reminder ${reminderId}`);
      }
    }
  };

  const value: NotificationContextType = {
    showNotification: handleShowNotification,
    handleServiceWorkerMessage
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Combined provider that wraps all notification contexts
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  return (
    <NotificationSettingsProvider>
      <NotificationPermissionProvider>
        <NotificationHistoryProvider>
          <NotificationProviderInner>
            {children}
          </NotificationProviderInner>
        </NotificationHistoryProvider>
      </NotificationPermissionProvider>
    </NotificationSettingsProvider>
  );
};

// Re-export hooks for convenience
export { 
  useNotificationSettings,
  useNotificationPermission,
  useNotificationHistory
};
