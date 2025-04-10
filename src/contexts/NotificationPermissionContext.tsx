
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  PermissionRequestResult,
  BrowserPermissionState, 
  NotificationPermissionContextState 
} from '@/types/notifications';
import { requestNotificationPermission, firebaseInitPromise } from '@/services/notificationService';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';

const NotificationPermissionContext = createContext<NotificationPermissionContextState>({
  permissionGranted: false,
  isSupported: true,
  requestPermission: async () => ({ granted: false }),
  hasPermission: () => false,
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
        
        // iOS-specific logging
        if (browserDetection.isIOS()) {
          iosPushLogger.logPermissionEvent('initial-check', { 
            permission: Notification.permission,
            isIOSSafari: browserDetection.isIOSSafari(),
            supportsWebPush: browserDetection.supportsIOSWebPush()
          });
        }
      } else {
        setIsSupported(false);
        
        // iOS-specific logging for unsupported browsers
        if (browserDetection.isIOS()) {
          iosPushLogger.logPermissionEvent('not-supported', {
            reason: !window ? 'server-side' : 'no-notification-api'
          });
        }
      }
    };
    
    checkPermission();
  }, []);

  // Request notification permission with iOS-specific handling
  const requestPermission = async (): Promise<PermissionRequestResult> => {
    try {
      // Check if Notification API is supported
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        setIsSupported(false);
        
        // iOS-specific logging
        if (browserDetection.isIOS()) {
          iosPushLogger.logPermissionEvent('api-not-supported');
        }
        
        throw new Error('Notifications not supported in this browser');
      }
      
      // iOS-specific handling
      if (browserDetection.isIOS()) {
        iosPushLogger.logPermissionEvent('request-start', {
          currentPermission: Notification.permission
        });
        
        // Check if this iOS version supports web push
        if (!browserDetection.supportsIOSWebPush()) {
          iosPushLogger.logPermissionEvent('ios-version-unsupported', {
            version: browserDetection.getIOSVersion()
          });
          
          return { 
            granted: false, 
            reason: 'ios-version-unsupported',
            error: new Error(`iOS version ${browserDetection.getIOSVersion()} doesn't support web push`)
          };
        }
      }
      
      // Wait for Firebase to initialize
      await firebaseInitPromise;
      
      // Request permission
      console.log('Requesting notification permission...');
      const token = await requestNotificationPermission();
      console.log('Permission request result token:', token ? 'received' : 'not received');
      
      const granted = !!token;
      setPermissionGranted(granted);
      
      // iOS specific logging
      if (browserDetection.isIOS()) {
        iosPushLogger.logPermissionEvent('request-complete', {
          granted,
          token: token ? `${token.substring(0, 5)}...` : null
        });
      }
      
      return { 
        granted,
        token: token || null
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      
      // iOS specific error logging
      if (browserDetection.isIOS()) {
        iosPushLogger.logPermissionEvent('request-error', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      return { 
        granted: false,
        error: error instanceof Error ? error : new Error('Unknown error requesting permission')
      };
    }
  };

  // Check if permission is granted
  const hasPermission = (): boolean => {
    return permissionGranted;
  };

  const value: NotificationPermissionContextState = {
    permissionGranted,
    isSupported,
    requestPermission,
    hasPermission
  };

  return (
    <NotificationPermissionContext.Provider value={value}>
      {children}
    </NotificationPermissionContext.Provider>
  );
};
