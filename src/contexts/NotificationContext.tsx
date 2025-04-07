import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Reminder } from '@/types/reminderTypes';
import { 
  setupForegroundMessageListener,
  getUserNotificationSettings,
  defaultNotificationSettings,
  firebaseInitPromise
} from '@/services/notificationService';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { showNotification, formatReminderForNotification } from '@/utils/notificationUtils';
import { ToastAction } from '@/components/ui/toast';
import { 
  NotificationSettings, 
  NotificationRecord, 
  ServiceWorkerMessage,
  PermissionRequestResult
} from '@/types/notificationTypes';

interface NotificationContextType {
  notificationSettings: NotificationSettings;
  permissionGranted: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<PermissionRequestResult>;
  showNotification: (reminder: Reminder) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  notificationHistory?: NotificationRecord[];
}

const NotificationContext = createContext<NotificationContextType>({
  notificationSettings: defaultNotificationSettings,
  permissionGranted: false,
  isSupported: true,
  requestPermission: async () => ({ granted: false }),
  showNotification: () => {},
  updateSettings: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const { permissionGranted, isSupported, requestPermission: hookRequestPermission } = useNotificationPermission();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from local storage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Initialize notification settings
  useEffect(() => {
    const initializeNotificationSettings = async () => {
      try {
        if (!userId) return;
        
        // Get user notification settings
        const settings = await getUserNotificationSettings(userId);
        setNotificationSettings(settings);
        
        console.log('Notification settings initialized:', settings);
      } catch (error) {
        console.error('Error initializing notification settings:', error);
      }
    };

    if (userId) {
      initializeNotificationSettings();
    }
  }, [userId]);

  // Setup foreground message listener
  useEffect(() => {
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

  // Update notification settings
  const updateSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      if (!userId) {
        console.error('Cannot update notification settings: No user ID available');
        return;
      }
      
      // Merge new settings with current settings
      const updatedSettings = {
        ...notificationSettings,
        ...settings
      };
      
      // Save to Firestore via notificationService
      const { updateUserNotificationSettings } = await import('@/services/notificationService');
      await updateUserNotificationSettings(userId, updatedSettings);
      
      // Update local state
      setNotificationSettings(updatedSettings);
      
      console.log('Notification settings updated:', updatedSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  };

  // Wrapper for showNotification utility
  const handleShowNotification = (reminder: Reminder) => {
    showNotification(reminder, notificationSettings, toast);
  };

  // Add service worker message handler
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const message = event.data as ServiceWorkerMessage;
      
      if (message && message.type === 'NOTIFICATION_ACTION') {
        console.log('Received notification action from service worker:', message);
        
        // Handle notification actions from service worker
        // This will be implemented in Phase 2
      }
    };

    // Add event listener for service worker messages
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Wrapper for requestPermission that returns the proper type
  const handleRequestPermission = async (): Promise<PermissionRequestResult> => {
    try {
      // Wait for Firebase to initialize
      await firebaseInitPromise;
      
      const result = await hookRequestPermission();
      return { granted: result };
    } catch (error) {
      console.error('Error requesting permission:', error);
      return { 
        granted: false, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  const contextValue: NotificationContextType = {
    notificationSettings,
    permissionGranted,
    isSupported,
    requestPermission: handleRequestPermission,
    showNotification: handleShowNotification,
    updateSettings,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
