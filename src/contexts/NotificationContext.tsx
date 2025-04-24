import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Reminder, NotificationType } from '@/types/reminderTypes';
import { 
  showNotification, 
  formatReminderForNotification 
} from '@/utils/notificationUtils';
import { NotificationSettingsProvider, useNotificationSettings } from './NotificationSettingsContext';
import { NotificationPermissionProvider, useNotificationPermission } from './NotificationPermissionContext';
import { NotificationHistoryProvider, useNotificationHistory } from './notificationHistory';
import { setupForegroundMessageListener } from '@/services/messaging/messagingService';
import { 
  ServiceWorkerMessage,
  NotificationDeliveryStatus,
  NotificationChannel,
} from '@/types/notifications';
import { ToastAction } from '@/components/ui/toast';

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

const NotificationProviderInner: React.FC<NotificationProviderProps> = ({ children }) => {
  const { settings } = useNotificationSettings();
  const { permissionGranted, isSupported, requestPermission } = useNotificationPermission();
  const { addNotification, updateNotificationStatus } = useNotificationHistory();
  const { toast } = useToast();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      const unsubscribe = setupForegroundMessageListener((payload) => {
        console.log('Received foreground message:', payload);
        
        const notification = payload.notification;
        const data = payload.data || {};
        
        toast({
          title: notification?.title || 'New Reminder',
          description: notification?.body || 'You have a new reminder',
          duration: 5000,
          variant: data.priority === 'high' ? 'destructive' : 'default',
          action: data.reminderId && data.reminderId !== 'test-reminder' ? (
            <ToastAction
              altText="View reminder"
              onClick={() => {
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

  React.useEffect(() => {
    const handleMessageEvent = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        const message = event.data as ServiceWorkerMessage;
        if (message.type === 'NOTIFICATION_ACTION') {
          handleServiceWorkerMessage(message);
        }
      }
    };

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessageEvent);
    }

    return () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessageEvent);
      }
    };
  }, []);

  const handleShowNotification = (reminder: Reminder) => {
    showNotification(reminder, settings, toast);
    
    const formattedNotification = formatReminderForNotification(reminder);
    if (formattedNotification) {
      addNotification({
        id: `reminder-${reminder.id}-${Date.now()}`,
        title: formattedNotification.title,
        body: formattedNotification.description || '',
        timestamp: Date.now(),
        type: NotificationType.TEST,
        reminderId: reminder.id,
        priority: reminder.priority,
        status: NotificationDeliveryStatus.SENT,
        channels: [NotificationChannel.IN_APP]
      });
    }
  };

  const handleServiceWorkerMessage = (message: ServiceWorkerMessage) => {
    console.log('Handling service worker message:', message);
    
    if (message.type === 'NOTIFICATION_ACTION' && message.payload) {
      const { reminderId, action, notification } = message.payload;
      
      if (notification?.id) {
        updateNotificationStatus(notification.id, 'clicked');
      }
      
      if (action && reminderId) {
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

export { 
  useNotificationSettings,
  useNotificationPermission,
  useNotificationHistory
};
