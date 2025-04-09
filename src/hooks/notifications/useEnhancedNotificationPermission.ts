
import { useCallback, useState } from 'react';
import { useNotificationPermission } from './useNotificationPermission';
import { PermissionRequestResult } from '@/types/notifications';
import { browserDetection } from '@/utils/browserDetection';
import { classifyIOSPushError, ClassifiedError } from '@/utils/iosErrorHandler';
import { recordTelemetryEvent, startEventTiming } from '@/utils/iosPushTelemetry';

/**
 * Enhanced hook for notification permission with error handling
 * Provides detailed error classification and recovery paths
 */
export function useEnhancedNotificationPermission() {
  const { permissionGranted, isSupported, requestPermission } = useNotificationPermission();
  const [lastError, setLastError] = useState<ClassifiedError | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Request permission with enhanced error handling
  const requestPermissionWithErrorHandling = useCallback(async (): Promise<{
    result: PermissionRequestResult,
    classifiedError?: ClassifiedError
  }> => {
    // Reset error state
    setLastError(null);
    setIsRequesting(true);
    
    try {
      // Start timing the permission request for telemetry
      const timing = startEventTiming('permission-request');
      
      // Make the actual permission request
      const result = await requestPermission();
      
      if (result.granted) {
        // Success case
        await timing.completeEvent('success', {
          token: result.token ? 'received' : 'missing'
        });
        
        setIsRequesting(false);
        return { result };
      } else {
        // Permission was not granted
        const errorContext = {
          permission: Notification.permission,
          iosVersion: browserDetection.isIOS() ? browserDetection.getIOSVersion() : undefined,
          isPWA: browserDetection.isIOSPWA()
        };
        
        // Classify the error
        const classifiedError = classifyIOSPushError(
          result.reason || result.error || 'Permission denied', 
          errorContext
        );
        
        // Update state
        setLastError(classifiedError);
        
        // Record telemetry
        await timing.completeEvent('failure', {
          errorCategory: classifiedError.category,
          reason: result.reason
        });
        
        setIsRequesting(false);
        return { result, classifiedError };
      }
    } catch (error) {
      // Unexpected errors
      const errorContext = {
        permission: typeof Notification !== 'undefined' ? Notification.permission : 'unavailable',
        iosVersion: browserDetection.isIOS() ? browserDetection.getIOSVersion() : undefined
      };
      
      // Classify the error
      const classifiedError = classifyIOSPushError(error, errorContext);
      
      // Update state
      setLastError(classifiedError);
      
      // Record telemetry for the error
      recordTelemetryEvent({
        eventType: 'error',
        isPWA: browserDetection.isIOSPWA(),
        iosVersion: browserDetection.getIOSVersion()?.toString(),
        timestamp: Date.now(),
        result: 'failure',
        errorCategory: classifiedError.category,
        metadata: {
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });
      
      setIsRequesting(false);
      
      return { 
        result: { 
          granted: false,
          error,
          reason: error instanceof Error ? error.message : String(error)
        }, 
        classifiedError 
      };
    }
  }, [requestPermission]);
  
  // Clear last error
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);
  
  // Track recovery action clicks
  const trackRecoveryAction = useCallback((actionLabel: string) => {
    if (!lastError) return;
    
    recordTelemetryEvent({
      eventType: 'recovery-action',
      isPWA: browserDetection.isIOSPWA(),
      iosVersion: browserDetection.getIOSVersion()?.toString(),
      timestamp: Date.now(),
      result: 'success', // Tracking that the action was performed
      errorCategory: lastError.category,
      metadata: {
        actionLabel
      }
    });
  }, [lastError]);
  
  return {
    // Basic permission state
    permissionGranted,
    isSupported,
    isRequesting,
    
    // Enhanced request method
    requestPermissionWithErrorHandling,
    
    // Error handling
    lastError,
    clearError,
    trackRecoveryAction
  };
}

export default useEnhancedNotificationPermission;
