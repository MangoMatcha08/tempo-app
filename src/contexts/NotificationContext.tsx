
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Reminder } from '@/types/reminderTypes';
import { 
  setupForegroundMessageListener,
  getUserNotificationSettings,
  NotificationSettings,
  defaultNotificationSettings,
  completeReminderFromNotification,
  snoozeReminderFromNotification
} from '@/services/notificationService';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { showNotification, formatReminderForNotification } from '@/utils/notificationUtils';
import { ToastAction } from '@/components/ui/toast';
import { useReminders } from '@/hooks/reminders/use-reminders';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  reminderId?: string;
}

interface NotificationContextType {
  notificationSettings: NotificationSettings;
  permissionGranted: boolean;
  isSupported: boolean;
  unreadCount: number;
  requestPermission: () => Promise<boolean>;
  showNotification: (reminder: Reminder) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  handleCompleteAction: (reminderId: string) => Promise<boolean>;
  handleSnoozeAction: (reminderId: string, minutes?: number) => Promise<boolean>;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notificationSettings: defaultNotificationSettings,
  permissionGranted: false,
  isSupported: true,
  unreadCount: 0,
  requestPermission: async () => false,
  showNotification: () => {},
  updateSettings: async () => {},
  handleCompleteAction: async () => false,
  handleSnoozeAction: async () => false,
  markAllRead: () => {}
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const { permissionGranted, isSupported, requestPermission } = useNotificationPermission();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const { refreshReminders } = useReminders();

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
        
        // Add to unread count
        setUnreadCount(prev => prev + 1);
        
        // Add to notifications array (for notification center)
        if (notification?.title) {
          setNotifications(prev => [
            {
              title: notification.title,
              body: notification.body || '',
              data,
              reminderId: data.reminderId
            },
            ...prev.slice(0, 9) // Keep last 10 notifications
          ]);
        }
        
        // Show toast notification for foreground messages
        toast({
          title: notification?.title || 'New Reminder',
          description: notification?.body || 'You have a new reminder',
          duration: 5000,
          variant: data.priority === 'high' ? 'destructive' : 'default',
          action: data.reminderId && data.reminderId !== 'test-reminder' ? (
            <div className="flex space-x-2">
              {data.action !== 'completed' && (
                <ToastAction
                  altText="Complete"
                  onClick={() => handleCompleteAction(data.reminderId)}
                >
                  Complete
                </ToastAction>
              )}
              <ToastAction
                altText="View"
                onClick={() => {
                  // Navigate to the reminder detail view
                  if (typeof window !== 'undefined') {
                    window.location.href = `/dashboard/reminders/${data.reminderId}`;
                  }
                }}
              >
                View
              </ToastAction>
            </div>
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

  // Handle complete action from notification
  const handleCompleteAction = async (reminderId: string): Promise<boolean> => {
    if (!reminderId) return false;
    
    try {
      const result = await completeReminderFromNotification(reminderId);
      
      if (result.success) {
        toast({
          title: "Reminder Completed",
          description: "Reminder has been marked as complete",
          duration: 3000,
        });
        
        // Refresh reminders list to show the updated state
        await refreshReminders();
        return true;
      } else {
        toast({
          title: "Action Failed",
          description: "Unable to complete the reminder. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast({
        title: "Error",
        description: "An error occurred while completing the reminder.",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }
  };

  // Handle snooze action from notification
  const handleSnoozeAction = async (reminderId: string, minutes: number = 30): Promise<boolean> => {
    if (!reminderId) return false;
    
    try {
      const result = await snoozeReminderFromNotification(reminderId, minutes);
      
      if (result.success) {
        toast({
          title: "Reminder Snoozed",
          description: `Reminder snoozed for ${minutes} minutes`,
          duration: 3000,
        });
        
        // Refresh reminders list to show the updated state
        await refreshReminders();
        return true;
      } else {
        toast({
          title: "Action Failed",
          description: "Unable to snooze the reminder. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
        return false;
      }
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      toast({
        title: "Error",
        description: "An error occurred while snoozing the reminder.",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }
  };

  // Mark all notifications as read
  const markAllRead = () => {
    setUnreadCount(0);
  };

  // Wrapper for showNotification utility
  const handleShowNotification = (reminder: Reminder) => {
    showNotification(reminder, notificationSettings, toast);
  };

  const contextValue: NotificationContextType = {
    notificationSettings,
    permissionGranted,
    isSupported,
    unreadCount,
    requestPermission,
    showNotification: handleShowNotification,
    updateSettings,
    handleCompleteAction,
    handleSnoozeAction,
    markAllRead
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
