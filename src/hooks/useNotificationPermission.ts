
import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/services/notificationService';
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';

export const useNotificationPermission = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

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
  const requestPermission = async (): Promise<PermissionRequestResult> => {
    setLoading(true);
    try {
      // Check if Notification API is supported
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        setIsSupported(false);
        setLoading(false);
        return {
          granted: false,
          error: new Error('Notifications not supported in this browser')
        };
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
        setLoading(false);
        return {
          granted,
          token: token || null
        };
      } else {
        // For devices where permission is already granted, 
        // we still want to register the FCM token for this device
        console.log('Permission already granted, registering token');
        const token = await requestNotificationPermission();
        setLoading(false);
        return {
          granted: true,
          token: token || null
        };
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setLoading(false);
      return {
        granted: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  return {
    permissionGranted,
    isSupported,
    loading,
    requestPermission
  };
};

export default useNotificationPermission;
