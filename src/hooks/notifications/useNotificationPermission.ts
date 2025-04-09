
import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission } from '@/services/notificationService';
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';

/**
 * Hook for managing notification permissions
 */
export function useNotificationPermission() {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  
  // Check the current permission status
  const checkPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setIsSupported(false);
      return false;
    }
    return Notification.permission === 'granted';
  }, []);
  
  // Request permission from the user
  const requestPermission = useCallback(async (): Promise<PermissionRequestResult> => {
    if (typeof Notification === 'undefined') {
      setIsSupported(false);
      return { granted: false, error: new Error('Notifications not supported') };
    }
    
    setLoading(true);
    
    try {
      // Use our service to request permission
      const token = await requestNotificationPermission();
      
      // Check if permission was granted
      const granted = await checkPermission();
      setPermissionGranted(granted);
      
      return {
        granted,
        token: token || null
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { 
        granted: false, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    } finally {
      setLoading(false);
    }
  }, [checkPermission]);
  
  // Check permission status on mount
  useEffect(() => {
    async function init() {
      // Check if notifications are supported
      if (typeof Notification === 'undefined') {
        setIsSupported(false);
        return;
      }
      
      const granted = await checkPermission();
      setPermissionGranted(granted);
    }
    init();
  }, [checkPermission]);
  
  return {
    permissionGranted,
    requestPermission,
    loading,
    isSupported
  };
}

export default useNotificationPermission;
