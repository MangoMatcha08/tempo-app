
import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission } from '@/services/notificationService';

/**
 * Hook for managing notification permissions
 */
export function useNotificationPermission() {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Check the current permission status
  const checkPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    return Notification.permission === 'granted';
  }, []);
  
  // Request permission from the user
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    setLoading(true);
    
    try {
      // Use our service to request permission
      await requestNotificationPermission();
      
      // Check if permission was granted
      const granted = await checkPermission();
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkPermission]);
  
  // Check permission status on mount
  useEffect(() => {
    async function init() {
      const granted = await checkPermission();
      setPermissionGranted(granted);
    }
    init();
  }, [checkPermission]);
  
  return {
    permissionGranted,
    requestPermission,
    loading
  };
}

export default useNotificationPermission;
