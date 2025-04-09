
/**
 * Notification Permission Hook
 * 
 * Provides access to notification permission state and methods
 * 
 * @module hooks/notifications/useNotificationPermission
 */

import { useCallback } from 'react';
import { 
  useNotificationPermission as usePermissionContext
} from '@/contexts/NotificationPermissionContext';
import { NotificationPermission } from './types';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { requestIOSPushPermission } from '@/utils/iosPermissionUtils';

/**
 * Hook for notification permission management
 * 
 * @returns Permission state and methods
 */
export function useNotificationPermission(): NotificationPermission {
  const context = usePermissionContext();
  
  // Enhanced request permission function with iOS support
  const requestPermission = useCallback(async () => {
    // For iOS, use the specialized iOS permission flow
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('hook-request-start', {
        isIOSSafari: browserDetection.isIOSSafari(),
        isPWA: browserDetection.isIOSPWA(),
        iosVersion: browserDetection.getIOSVersion()
      });
      
      // Use iOS-specific permission flow
      return requestIOSPushPermission();
    }
    
    // For other platforms, use the standard permission flow
    return context.requestPermission();
  }, [context.requestPermission]);
  
  // Forward methods from context with appropriate typing and iOS enhancement
  return {
    permissionGranted: context.permissionGranted,
    isSupported: context.isSupported,
    requestPermission: requestPermission
  };
}

export default useNotificationPermission;
