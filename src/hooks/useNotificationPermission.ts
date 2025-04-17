
import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission } from '@/services/notificationService';
import { PermissionRequestResult, PermissionErrorReason } from '@/types/notifications/permissionTypes';
import { toast } from "sonner";
import { browserDetection } from '@/utils/browserDetection';

export const useNotificationPermission = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [lastRequest, setLastRequest] = useState<{
    time: number;
    result?: PermissionRequestResult;
  } | null>(null);

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

  // Request notification permission with proper error handling and improved UX
  const requestPermission = async (): Promise<PermissionRequestResult> => {
    try {
      setLastRequest({ time: Date.now() });
      
      // Check if Notification API is supported
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        setIsSupported(false);
        
        const result: PermissionRequestResult = {
          granted: false,
          error: new Error('Notifications not supported in this browser'),
          reason: PermissionErrorReason.BROWSER_UNSUPPORTED
        };
        
        setLastRequest(prev => prev ? { ...prev, result } : null);
        return result;
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
          
          // Create result object with detailed information
          const result: PermissionRequestResult = {
            granted,
            token: token || null,
            reason: granted ? undefined : PermissionErrorReason.PERMISSION_DENIED
          };
          
          if (granted && browserDetection.isIOS()) {
            // Special success toast for iOS users who often have more steps
            toast.success("iOS Push Notifications Enabled", {
              description: "You've successfully set up push notifications for this device."
            });
          }
          
          setLastRequest(prev => prev ? { ...prev, result } : null);
          return result;
        } catch (requestError) {
          console.error('Error in requestNotificationPermission:', requestError);
          
          const result: PermissionRequestResult = {
            granted: false,
            error: requestError instanceof Error ? requestError : new Error(String(requestError)),
            reason: PermissionErrorReason.UNKNOWN_ERROR
          };
          
          setLastRequest(prev => prev ? { ...prev, result } : null);
          return result;
        }
      } else {
        // For devices where permission is already granted, 
        // we still want to register the FCM token for this device
        console.log('Permission already granted, registering token');
        try {
          const token = await requestNotificationPermission();
          
          const result: PermissionRequestResult = {
            granted: true,
            token: token || null
          };
          
          setLastRequest(prev => prev ? { ...prev, result } : null);
          return result;
        } catch (tokenError) {
          console.error('Error getting token for already granted permission:', tokenError);
          
          const result: PermissionRequestResult = {
            granted: true, // Permission is still granted even if token fails
            error: tokenError instanceof Error ? tokenError : new Error(String(tokenError)),
            reason: PermissionErrorReason.TOKEN_REQUEST_FAILED
          };
          
          setLastRequest(prev => prev ? { ...prev, result } : null);
          return result;
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      
      const result: PermissionRequestResult = {
        granted: false,
        error: error instanceof Error ? error : new Error(String(error)),
        reason: PermissionErrorReason.UNKNOWN_ERROR
      };
      
      setLastRequest(prev => prev ? { ...prev, result } : null);
      return result;
    }
  };

  // Add a function to check current permission status
  const hasPermission = useCallback((): boolean => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    permissionGranted,
    isSupported,
    requestPermission,
    hasPermission,
    lastRequest  // Export the last request data for UI components
  };
};

export default useNotificationPermission;
