
import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/services/notificationService';
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';

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

  // Request notification permission with proper error handling
  const requestPermission = async (): Promise<PermissionRequestResult> => {
    try {
      // Check if Notification API is supported
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        setIsSupported(false);
        return {
          granted: false,
          error: new Error('Notifications not supported in this browser'),
          reason: 'browser-unsupported'
        };
      }
      
      // Log the current permission status
      console.log('Current permission status:', Notification.permission);
      
      // Reset Notification permission status if it's not granted
      if (Notification.permission !== 'granted') {
        console.log('Requesting notification permission...');
        try {
          const token = await requestNotificationPermission();
          console.log('Permission request result token:', token);
          const granted = !!token;
          setPermissionGranted(granted);
          
          return {
            granted,
            token: token || null,
            reason: granted ? undefined : 'permission-denied'
          };
        } catch (requestError) {
          console.error('Error in requestNotificationPermission:', requestError);
          return {
            granted: false,
            error: requestError instanceof Error ? requestError : new Error(String(requestError)),
            reason: 'request-error'
          };
        }
      } else {
        // For devices where permission is already granted, 
        // we still want to register the FCM token for this device
        console.log('Permission already granted, registering token');
        try {
          const token = await requestNotificationPermission();
          return {
            granted: true,
            token: token || null
          };
        } catch (tokenError) {
          console.error('Error getting token for already granted permission:', tokenError);
          return {
            granted: true, // Permission is still granted even if token fails
            error: tokenError instanceof Error ? tokenError : new Error(String(tokenError)),
            reason: 'token-error'
          };
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return {
        granted: false,
        error: error instanceof Error ? error : new Error(String(error)),
        reason: 'unknown-error'
      };
    }
  };

  // Add a function to check current permission status
  const hasPermission = (): boolean => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  };

  return {
    permissionGranted,
    isSupported,
    requestPermission,
    hasPermission
  };
};
