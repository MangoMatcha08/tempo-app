
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
import { NotificationDeliveryStatus } from '@/types/notifications/notificationHistoryTypes';
import { serviceWorkerManager } from '@/services/serviceWorker/serviceWorkerManager';
import { offlineQueue } from '@/services/offline/offlineQueue';
import { networkStatus } from '@/services/offline/networkStatus';
import { logger } from '@/services/serviceWorker/serviceWorkerLogger';

interface NotificationContextType {
  showNotification: (reminder: Reminder) => void;
  handleServiceWorkerMessage: (message: ServiceWorkerMessage) => void;
  serviceWorkerSupported: boolean;
  isOffline: boolean;
  offlineQueueSize: number;
  refreshOfflineQueueSize: () => Promise<number>;
}

const NotificationContext = React.createContext<NotificationContextType>({
  showNotification: () => {},
  handleServiceWorkerMessage: () => {},
  serviceWorkerSupported: false,
  isOffline: false,
  offlineQueueSize: 0,
  refreshOfflineQueueSize: async () => 0
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
  const [serviceWorkerSupported, setServiceWorkerSupported] = React.useState<boolean>(false);
  const [isOffline, setIsOffline] = React.useState<boolean>(!navigator.onLine);
  const [offlineQueueSize, setOfflineQueueSize] = React.useState<number>(0);

  // Initialize service worker manager
  React.useEffect(() => {
    const initServiceWorker = async () => {
      try {
        const isSupported = serviceWorkerManager.isServiceWorkerSupported();
        setServiceWorkerSupported(isSupported);
        
        if (isSupported) {
          logger.info('Service worker is supported, initializing...');
          
          // Initialize the service worker manager
          const initialized = await serviceWorkerManager.init();
          
          if (initialized) {
            logger.info('Service worker manager initialized successfully');
            
            // Refresh offline queue size
            refreshOfflineQueueSize();
          } else {
            logger.warn('Failed to initialize service worker manager');
          }
        } else {
          logger.warn('Service workers are not supported in this browser');
        }
      } catch (error) {
        logger.error('Error initializing service worker manager', error);
      }
    };
    
    initServiceWorker();
    
    // Clean up on unmount
    return () => {
      serviceWorkerManager.cleanup();
    };
  }, []);
  
  // Set up network status monitoring
  React.useEffect(() => {
    const unsubscribe = networkStatus.addStatusListener((online) => {
      setIsOffline(!online);
      
      // If we're back online, refresh the queue size
      if (online) {
        refreshOfflineQueueSize();
      }
      
      // Show toast notification for network status change
      toast({
        title: online ? 'Back Online' : 'Offline Mode',
        description: online 
          ? 'Your connection has been restored. Syncing data...' 
          : 'You are now offline. Changes will be saved and synced when you reconnect.',
        duration: 5000,
        variant: online ? 'default' : 'destructive',
      });
    });
    
    return () => {
      unsubscribe();
    };
  }, [toast]);
  
  // Refresh offline queue size
  const refreshOfflineQueueSize = async (): Promise<number> => {
    try {
      const size = await offlineQueue.getQueueSize();
      setOfflineQueueSize(size);
      return size;
    } catch (error) {
      logger.error('Error getting offline queue size', error);
      return 0;
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      const unsubscribe = setupForegroundMessageListener((payload) => {
        logger.info('Received foreground message:', payload);
        
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
    // Set up service worker message listener
    const unsubscribe = serviceWorkerManager.addMessageListener('*', (message) => {
      handleServiceWorkerMessage(message);
    });
    
    return () => {
      unsubscribe();
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
        channels: ['inApp']
      });
    }
  };

  const handleServiceWorkerMessage = (message: ServiceWorkerMessage) => {
    logger.info('Handling service worker message:', message);
    
    if (message.type === 'NOTIFICATION_ACTION' && message.payload) {
      const { reminderId, action, notification } = message.payload;
      
      if (notification?.id) {
        updateNotificationStatus(notification.id, NotificationDeliveryStatus.CLICKED);
      }
      
      if (action && reminderId) {
        logger.info(`Handling ${action} action for reminder ${reminderId}`);
        
        // Show success toast
        toast({
          title: `Reminder ${action}`,
          description: `Successfully ${action}ed reminder`,
          duration: 3000
        });
      }
    } else if (message.type === 'READY') {
      logger.info('Service worker is ready');
    }
  };

  const value: NotificationContextType = {
    showNotification: handleShowNotification,
    handleServiceWorkerMessage,
    serviceWorkerSupported,
    isOffline,
    offlineQueueSize,
    refreshOfflineQueueSize
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
