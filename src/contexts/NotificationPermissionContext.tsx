import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  PermissionRequestResult,
  BrowserPermissionState, 
  NotificationPermissionContextState 
} from '@/types/notifications';
import { requestNotificationPermission, firebaseInitPromise } from '@/services/notificationService';

const NotificationPermissionContext = createContext<NotificationPermissionContextState>({
  permissionGranted: false,
  isSupported: true,
  requestPermission: async () => ({ granted: false }),
});

/**
 * Custom hook to access notification permission context
 * @returns The notification permission context state
 */
export const useNotificationPermission = () => useContext(NotificationPermissionContext);

interface NotificationPermissionProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for notification permissions
 * Manages and exposes notification permission state
 */
export const NotificationPermissionProvider: React.FC<NotificationPermissionProviderProps> = ({ children }) => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Check initial permission status
  useEffect(() => {
    const checkPermission = () => {
      // Check if notifications are supported
      if (typeof window !== 'undefined' && 'Notification' in window) {
        // Check permission status
        if (Notification.permission === 'granted') {
          setPermissionGranted(true);
        }
      } else {
        setIsSupported(false);
      }
    };
    
    checkPermission();
  }, []);

  // Request notification permission
  const requestPermission = async (): Promise<PermissionRequestResult> => {
    try {
      // Check if Notification API is supported
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        setIsSupported(false);
        throw new Error('Notifications not supported in this browser');
      }
      
      // Wait for Firebase to initialize
      await firebaseInitPromise;
      
      // Request permission
      console.log('Requesting notification permission...');
      const token = await requestNotificationPermission();
      console.log('Permission request result token:', token);
      
      const granted = !!token;
      setPermissionGranted(granted);
      
      return { 
        granted,
        token: token || null
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { 
        granted: false,
        error: error instanceof Error ? error : new Error('Unknown error requesting permission')
      };
    }
  };

  const value: NotificationPermissionContextState = {
    permissionGranted,
    isSupported,
    requestPermission
  };

  return (
    <NotificationPermissionContext.Provider value={value}>
      {children}
    </NotificationPermissionContext.Provider>
  );
};
