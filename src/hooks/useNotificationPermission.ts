import { useEffect, useState, useCallback } from 'react';
import { requestNotificationPermission, sendTestNotification } from '@/services/notificationService';
import { createDebugLogger } from '@/utils/debugUtils';
import { isIOSDevice, isAndroidDevice, isPWAMode } from '@/services/notifications/firebase';

const debugLog = createDebugLogger("NotificationPermission");

type PermissionStatus = 'granted' | 'denied' | 'default' | 'loading' | 'unsupported';

export const useNotificationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isPWA: false
  });

  // Check initial permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        debugLog('Notifications not supported in this browser');
        setPermissionStatus('unsupported');
        return;
      }

      // Get current permission state
      const currentPermission = Notification.permission;
      debugLog(`Current notification permission: ${currentPermission}`);
      setPermissionStatus(currentPermission as PermissionStatus);

      // Check device type
      const isIOS = isIOSDevice();
      const isAndroid = isAndroidDevice();
      const isPWA = isPWAMode();
      
      setDeviceInfo({
        isIOS,
        isAndroid,
        isPWA
      });
      
      debugLog(`Device info - iOS: ${isIOS}, Android: ${isAndroid}, PWA: ${isPWA}`);

      // If already granted, try to get token
      if (currentPermission === 'granted') {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          setToken(fcmToken);
          debugLog('FCM token retrieved on initial check');
        }
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
      debugLog(`Error checking notification permission: ${error}`);
    } finally {
      setIsRequesting(false);
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      setIsRequesting(true);
      debugLog('Requesting notification permission');

      if (!('Notification' in window)) {
        debugLog('Notifications not supported in this browser');
        setPermissionStatus('unsupported');
        setIsRequesting(false);
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      debugLog(`Permission request result: ${permission}`);
      setPermissionStatus(permission as PermissionStatus);

      // If granted, get FCM token
      if (permission === 'granted') {
        const fcmToken = await requestNotificationPermission();
        setToken(fcmToken);
        debugLog(`FCM token ${fcmToken ? 'retrieved' : 'not available'}`);
        return fcmToken;
      }

      return null;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      debugLog(`Error requesting notification permission: ${error}`);
      return null;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  // Send a test notification
  const sendTestNotificationToDevice = useCallback(async () => {
    try {
      debugLog('Sending test notification');
      const result = await sendTestNotification('test@example.com');
      debugLog(`Test notification result: ${result}`);
      return result;
    } catch (error) {
      console.error('Error sending test notification:', error);
      debugLog(`Error sending test notification: ${error}`);
      return false;
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  return {
    permissionStatus,
    token,
    isRequesting,
    deviceInfo,
    requestPermission,
    sendTestNotification: sendTestNotificationToDevice
  };
};

export default useNotificationPermission;
