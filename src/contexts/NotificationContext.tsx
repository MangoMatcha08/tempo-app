
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Reminder } from '@/types/reminderTypes';
import { 
  setupForegroundMessageListener,
  getUserNotificationSettings,
  NotificationSettings,
  defaultNotificationSettings
} from '@/services/notificationService';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { showNotification } from '@/utils/notificationUtils';

interface NotificationContextType {
  notificationSettings: NotificationSettings;
  permissionGranted: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  showNotification: (reminder: Reminder) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notificationSettings: defaultNotificationSettings,
  permissionGranted: false,
  isSupported: true,
  requestPermission: async () => false,
  showNotification: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const { permissionStatus, isRequesting, deviceInfo, requestPermission: requestNotificationPermission } = useNotificationPermission();
  const { toast } = useToast();

  // Convert permissionStatus to a boolean permissionGranted
  const permissionGranted = permissionStatus === 'granted';
  // Determine if notifications are supported
  const isSupported = permissionStatus !== 'unsupported';

  // Initialize notification settings
  useEffect(() => {
    const initializeNotificationSettings = async () => {
      try {
        // Get user notification settings
        const userId = localStorage.getItem('userId') || 'anonymous';
        const settings = await getUserNotificationSettings(userId);
        setNotificationSettings(settings);
      } catch (error) {
        console.error('Error initializing notification settings:', error);
      }
    };

    initializeNotificationSettings();
  }, []);

  // Setup foreground message listener
  useEffect(() => {
    // Setup foreground message listener if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      const unsubscribe = setupForegroundMessageListener((payload) => {
        console.log('Received foreground message:', payload);
        
        // Show toast notification for foreground messages
        toast({
          title: payload.notification?.title || 'New Reminder',
          description: payload.notification?.body || 'You have a new reminder',
          duration: 5000,
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [toast]);

  // Wrapper for requestPermission that returns boolean instead of string
  const requestPermission = async (): Promise<boolean> => {
    const result = await requestNotificationPermission();
    return result === 'granted';
  };

  // Wrapper for showNotification utility
  const handleShowNotification = (reminder: Reminder) => {
    showNotification(reminder, notificationSettings, toast);
  };

  const contextValue: NotificationContextType = {
    notificationSettings,
    permissionGranted,
    isSupported,
    requestPermission,
    showNotification: handleShowNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
