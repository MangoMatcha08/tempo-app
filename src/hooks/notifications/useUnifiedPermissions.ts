/**
 * Unified permissions hook for notifications
 * 
 * This hook consolidates multiple permission-related hooks into a single interface
 * for easier usage throughout the application.
 */

import { useCallback, useState, useEffect } from 'react';
import { useNotificationPermission } from './useNotificationPermission';
import { useEnhancedNotificationPermission } from './useEnhancedNotificationPermission';
import { useIOSPermissionFlow } from './useIOSPermissionFlow';
import { browserDetection } from '@/utils/browserDetection';
import { recordTelemetryEvent } from '@/utils/iosPushTelemetry';
import { PermissionRequestResult } from '@/types/notifications';
import { createMetadata } from '@/utils/telemetryUtils';

/**
 * Hook that unifies various permission hooks into a single interface
 */
export function useUnifiedPermissions() {
  // Load all the permission hooks
  const basicPermission = useNotificationPermission();
  const enhancedPermission = useEnhancedNotificationPermission();
  const iosFlow = useIOSPermissionFlow();
  
  // Track performance metrics
  const [permissionMetrics, setPermissionMetrics] = useState<{
    lastRequestTime: number | null;
    requestDuration: number | null;
  }>({
    lastRequestTime: null,
    requestDuration: null,
  });

  // Determine if we're on iOS
  const isIOS = browserDetection.isIOS();

  // Unified request permission function with performance tracking
  const requestPermission = useCallback(async (): Promise<PermissionRequestResult> => {
    const startTime = performance.now();
    
    try {
      setPermissionMetrics(prev => ({
        ...prev,
        lastRequestTime: Date.now(),
      }));
      
      let result: PermissionRequestResult;
      
      // Use the appropriate permission request based on platform
      if (isIOS) {
        // Use the iOS-specific flow for iOS devices
        result = await iosFlow.startPermissionFlow() || {
          granted: false,
          reason: 'Request failed or was cancelled'
        };
      } else {
        // Use enhanced permission with error categorization for non-iOS
        const enhanced = await enhancedPermission.requestPermissionWithErrorHandling();
        result = enhanced.result;
      }
      
      // Record completion metrics
      const endTime = performance.now();
      setPermissionMetrics(prev => ({
        ...prev,
        requestDuration: endTime - startTime
      }));
      
      // Record telemetry for the request
      recordTelemetryEvent({
        eventType: 'permission-request',
        isPWA: browserDetection.isIOSPWA(),
        iosVersion: browserDetection.getIOSVersion()?.toString(),
        timestamp: Date.now(),
        result: result.granted ? 'success' : 'failure',
        timings: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime
        },
        metadata: createMetadata('Permission request completed', {
          platform: isIOS ? 'ios' : 'other',
          granted: result.granted,
          token: result.token ? 'received' : 'not-received'
        })
      });
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      const endTime = performance.now();
      
      // Record failure metrics
      setPermissionMetrics(prev => ({
        ...prev,
        requestDuration: endTime - startTime
      }));
      
      // Record error telemetry
      recordTelemetryEvent({
        eventType: 'error',
        isPWA: browserDetection.isIOSPWA(),
        iosVersion: browserDetection.getIOSVersion()?.toString(),
        timestamp: Date.now(),
        result: 'error',
        timings: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime
        },
        metadata: createMetadata('Permission request error', {
          error: error instanceof Error ? error.message : String(error)
        })
      });
      
      return {
        granted: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }, [isIOS, iosFlow, enhancedPermission]);

  // Return a unified interface combining all permission hooks
  return {
    // Basic permission state
    permissionGranted: basicPermission.permissionGranted,
    isSupported: basicPermission.isSupported,
    isIOS,
    
    // Request methods
    requestPermission,
    
    // iOS-specific info
    isPWA: iosFlow.isPWA,
    shouldPromptPwaInstall: iosFlow.shouldPromptPwaInstall,
    iosSupport: iosFlow.iosSupport,
    
    // Error handling (from enhanced permission)
    lastError: enhancedPermission.lastError,
    clearError: enhancedPermission.clearError,
    trackRecoveryAction: enhancedPermission.trackRecoveryAction,
    
    // Loading states
    isRequesting: enhancedPermission.isRequesting || iosFlow.isRequesting,
    
    // Performance metrics
    metrics: permissionMetrics
  };
}

export default useUnifiedPermissions;
