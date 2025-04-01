
import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/services/notificationService';

export const useNotificationPermission = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Check initial permission status
  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Check permission status
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      }
    }
  }, []);

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

  return {
    permissionGranted,
    requestPermission
  };
};
