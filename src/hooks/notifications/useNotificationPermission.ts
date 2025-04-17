
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
import { 
  getCurrentBrowserPermission, 
  savePermissionState,
  addRequestToHistory,
  isDebugModeEnabled
} from '@/services/notifications/permissionTracker';

/**
 * Hook for notification permission management
 * 
 * @returns Permission state and methods
 */
export function useNotificationPermission(): NotificationPermission {
  const context = usePermissionContext();
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(isDebugModeEnabled());
  
  // Check for debug mode changes
  useEffect(() => {
    const checkDebugMode = () => {
      setDebugMode(isDebugModeEnabled());
    };
    
    // Check initially and set up interval
    checkDebugMode();
    const intervalId = setInterval(checkDebugMode, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Show toast for permission state changes
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
  
  // Enhanced request permission function with iOS support, better feedback and tracking
  const requestPermission = useCallback(async (): Promise<PermissionRequestResult> => {
    const requestStartTime = Date.now();
    setLastRequestTime(requestStartTime);
    
    if (debugMode) {
      console.group('Permission Request');
      console.log('Starting permission request');
    }
    
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
          const result = await resumePermissionFlow();
          
          // Store the result for tracking
          const currentPermission = getCurrentBrowserPermission();
          savePermissionState(result.granted, currentPermission);
          addRequestToHistory(result);
          
          if (debugMode) {
            console.log('Resumed iOS flow result:', result);
            console.log('Current browser permission:', currentPermission);
            console.groupEnd();
          }
          
          return result;
        }
        
        // Use iOS-specific permission flow that returns a compatible PermissionRequestResult
        const result = await requestIOSPushPermission();
        
        // Store the result for tracking
        const currentPermission = getCurrentBrowserPermission();
        savePermissionState(result.granted, currentPermission);
        addRequestToHistory(result);
        
        if (debugMode) {
          console.log('iOS permission result:', result);
          console.log('Current browser permission:', currentPermission);
          console.groupEnd();
        }
        
        return result;
      } catch (error) {
        iosPushLogger.logPermissionEvent('ios-hook-error', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        if (debugMode) {
          console.error('iOS permission error:', error);
          console.groupEnd();
        }
        
        // Return a structured error response
        const errorResult = {
          granted: false,
          error: error instanceof Error ? error : new Error(String(error)),
          reason: PermissionErrorReason.UNKNOWN_ERROR
        };
        
        // Still track the error
        addRequestToHistory(errorResult);
        
        return errorResult;
      }
    }
    
    // For other platforms, use the standard permission flow
    try {
      const result = await context.requestPermission();
      
      // Store the result for tracking
      const currentPermission = getCurrentBrowserPermission();
      savePermissionState(result.granted, currentPermission);
      addRequestToHistory(result);
      
      if (debugMode) {
        console.log('Standard permission result:', result);
        console.log('Current browser permission:', currentPermission);
        console.log('Request duration:', Date.now() - requestStartTime, 'ms');
        console.groupEnd();
      }
      
      return result;
    } catch (error) {
      if (debugMode) {
        console.error('Standard permission error:', error);
        console.groupEnd();
      }
      
      const errorResult = {
        granted: false,
        error: error instanceof Error ? error : new Error(String(error)),
        reason: PermissionErrorReason.UNKNOWN_ERROR
      };
      
      // Still track the error
      addRequestToHistory(errorResult);
      
      return errorResult;
    }
  }, [context.requestPermission, debugMode]);

  // Check if permission is granted with appropriate logging
  const hasPermission = useCallback((): boolean => {
    const permissionGranted = context.hasPermission();
    
    // Log the current permission state for debugging
    if (browserDetection.isIOS() && debugMode) {
      iosPushLogger.logPermissionEvent('permission-check', {
        granted: permissionGranted,
        browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unavailable'
      });
    }
    
    return permissionGranted;
  }, [context.hasPermission, debugMode]);
  
  // Forward methods from context with appropriate typing and iOS enhancement
  return {
    permissionGranted: context.permissionGranted,
    isSupported: context.isSupported,
    requestPermission,
    hasPermission
  };
}

export default useNotificationPermission;
