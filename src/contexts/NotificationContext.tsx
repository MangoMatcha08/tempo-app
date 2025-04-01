
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Reminder, ReminderPriority } from '@/types/reminderTypes';
import { 
  requestNotificationPermission, 
  setupForegroundMessageListener,
  shouldSendNotification,
  getUserNotificationSettings,
  NotificationSettings,
  defaultNotificationSettings
} from '@/services/notificationService';

interface NotificationContextType {
  notificationSettings: NotificationSettings;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  showNotification: (reminder: Reminder) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notificationSettings: defaultNotificationSettings,
  permissionGranted: false,
  requestPermission: async () => false,
  showNotification: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize notification settings and check permission
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check if notifications are supported
        if (typeof window !== 'undefined' && 'Notification' in window) {
          // Check permission status
          if (Notification.permission === 'granted') {
            setPermissionGranted(true);
          }
        }

        // Get user notification settings
        const userId = localStorage.getItem('userId') || 'anonymous';
        const settings = await getUserNotificationSettings(userId);
        setNotificationSettings(settings);

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
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [toast]);

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      // Check if Notification API is supported
      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error('Notifications not supported in this browser');
      }
      
      const token = await requestNotificationPermission();
      const granted = !!token;
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Show notification based on reminder priority and user settings
  const showNotification = (reminder: Reminder) => {
    if (!notificationSettings.enabled) return;
    
    // Handle the priority type conversion properly
    const reminderPriority = reminder.priority as ReminderPriority;

    // Check if in-app notification should be shown
    if (shouldSendNotification(reminderPriority, notificationSettings, 'inApp')) {
      toast({
        title: reminder.title,
        description: reminder.description || 'Reminder',
        duration: 5000,
      });
    }

    // In a real implementation, push and email notifications would be sent from the server
    console.log('Should send push notification:', 
      shouldSendNotification(reminderPriority, notificationSettings, 'push'));
    console.log('Should send email notification:', 
      shouldSendNotification(reminderPriority, notificationSettings, 'email'));
  };

  const contextValue: NotificationContextType = {
    notificationSettings,
    permissionGranted,
    requestPermission,
    showNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
