
/**
 * Notification Permission Hook
 * 
 * Provides access to notification permission state and methods
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
import { 
  requestIOSPushPermission, 
  resumePermissionFlow 
} from '@/utils/iosPermissionUtils';
import { shouldResumeFlow } from '@/utils/iosPermissionFlowState';
import { PermissionRequestResult, PermissionErrorReason } from '@/types/notifications/permissionTypes';
import { toast } from "sonner";

/**
 * Hook for notification permission management
 * 
 * @returns Permission state and methods
 */
export function useNotificationPermission(): NotificationPermission {
  const context = usePermissionContext();
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  
  useEffect(() => {
    // Check if we need to display a toast when the permission state changes
    if (context.permissionGranted && lastRequestTime) {
      const timeSinceRequest = Date.now() - lastRequestTime;
      // Only show toast if permission was recently granted (within last 10 seconds)
      if (timeSinceRequest < 10000) {
        toast.success("Notification permission granted", {
          description: "You'll now receive important notifications.",
        });
      }
    }
  }, [context.permissionGranted, lastRequestTime]);
  
  // Enhanced request permission function with iOS support and better feedback
  const requestPermission = useCallback(async (): Promise<PermissionRequestResult> => {
    setLastRequestTime(Date.now());
    
    // For iOS, use the specialized iOS permission flow
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('hook-request-start', {
        isIOSSafari: browserDetection.isIOSSafari(),
        isPWA: browserDetection.isIOSPWA(),
        iosVersion: browserDetection.getIOSVersion(),
        resumeFlow: shouldResumeFlow()
      });
      
      try {
        // Check if we need to resume an interrupted flow
        if (shouldResumeFlow()) {
          return resumePermissionFlow();
        }
        
        // Use iOS-specific permission flow that returns a compatible PermissionRequestResult
        return requestIOSPushPermission();
      } catch (error) {
        iosPushLogger.logPermissionEvent('ios-hook-error', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Return a structured error response
        return {
          granted: false,
          error: error instanceof Error ? error : new Error(String(error)),
          reason: PermissionErrorReason.UNKNOWN_ERROR
        };
      }
    }
    
    // For other platforms, use the standard permission flow
    return context.requestPermission();
  }, [context.requestPermission]);

  // Check if permission is granted with appropriate logging
  const hasPermission = useCallback((): boolean => {
    const permissionGranted = context.hasPermission();
    
    // Log the current permission state for debugging
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('permission-check', {
        granted: permissionGranted,
        browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unavailable'
      });
    }
    
    return permissionGranted;
  }, [context.hasPermission]);
  
  // Forward methods from context with appropriate typing and iOS enhancement
  return {
    permissionGranted: context.permissionGranted,
    isSupported: context.isSupported,
    requestPermission,
    hasPermission
  };
}

export default useNotificationPermission;
