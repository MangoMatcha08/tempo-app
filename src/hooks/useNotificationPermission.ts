
import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/services/notificationService';

export const useNotificationPermission = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Check initial permission status
  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Check permission status
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      }
    } else {
      setIsSupported(false);
    }
  }, []);

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      // Check if Notification API is supported
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        setIsSupported(false);
        throw new Error('Notifications not supported in this browser');
      }
      
      // Log the current permission status
      console.log('Current permission status:', Notification.permission);
      
      // Reset Notification permission status if it's not granted
      if (Notification.permission !== 'granted') {
        console.log('Requesting notification permission...');
        const token = await requestNotificationPermission();
        console.log('Permission request result token:', token);
        const granted = !!token;
        setPermissionGranted(granted);
        return granted;
      } else {
        // For devices where permission is already granted, 
        // we still want to register the FCM token for this device
        console.log('Permission already granted, registering token');
        const token = await requestNotificationPermission();
        return !!token;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  return {
    permissionGranted,
    isSupported,
    requestPermission
  };
};
