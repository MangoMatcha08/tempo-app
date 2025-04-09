
/**
 * Notification Permission Hook
 * 
 * Provides access to notification permission state and methods
 * with iOS-specific optimizations
 * 
 * @module hooks/notifications/useNotificationPermission
 */

import { useCallback, useState, useEffect } from 'react';
import { 
  useNotificationPermission as usePermissionContext
} from '@/contexts/NotificationPermissionContext';
import { NotificationPermission } from './types';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';
import { DEBUG_MESSAGING } from '@/services/messaging/messagingService';

/**
 * Hook for notification permission management with iOS optimizations
 * 
 * @returns Permission state and methods
 */
export function useNotificationPermission(): NotificationPermission {
  const context = usePermissionContext();
  const [isRequesting, setIsRequesting] = useState(false);
  const isIOS = browserDetection.isIOS();
  
  // Enhanced request permission function with iOS support
  const requestPermission = useCallback(async (): Promise<PermissionRequestResult> => {
    // Prevent multiple simultaneous requests
    if (isRequesting) {
      if (DEBUG_MESSAGING) {
        console.log('Permission request already in progress');
      }
      return { granted: false, reason: 'request-in-progress' };
    }
    
    setIsRequesting(true);
    
    try {
      // For iOS, add additional logging
      if (isIOS) {
        iosPushLogger.logPermissionEvent('hook-request-start', {
          isIOSSafari: browserDetection.isIOSSafari(),
          isPWA: browserDetection.isIOSPWA(),
          iosVersion: browserDetection.getIOSVersion()
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
      
      // Call the original requestPermission with proper context
      const result = await context.requestPermission();
      
      // Additional iOS-specific logging
      if (isIOS && result.granted) {
        iosPushLogger.logPermissionEvent('ios-hook-success', {
          token: result.token ? `${result.token.substring(0, 5)}...` : null
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in permission request:', errorMessage);
      
      if (isIOS) {
        iosPushLogger.logPermissionEvent('ios-hook-error', { error: errorMessage });
      }
      
      return { 
        granted: false, 
        error: error instanceof Error ? error : new Error(errorMessage) 
      };
    } finally {
      setIsRequesting(false);
    }
  }, [context.requestPermission, isRequesting, isIOS]);
  
  // Forward methods from context with appropriate typing and iOS enhancement
  return {
    permissionGranted: context.permissionGranted,
    isSupported: context.isSupported,
    requestPermission: requestPermission,
    isRequesting
  };
}
