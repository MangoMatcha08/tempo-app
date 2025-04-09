
import { useState, useCallback } from 'react';
import { useNotificationPermission } from './useNotificationPermission';
import { browserDetection } from '@/utils/browserDetection';
import { iosPwaDetection } from '@/utils/iosPwaDetection';
import { checkIOSPushSupport } from '@/utils/iosPermissionUtils';
import { PermissionRequestResult } from '@/types/notifications';

/**
 * Hook for managing iOS permission flow
 * Provides methods and state for iOS push notification permission flow
 */
export function useIOSPermissionFlow() {
  const { permissionGranted, requestPermission, isSupported } = useNotificationPermission();
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastResult, setLastResult] = useState<PermissionRequestResult | null>(null);
  
  // Check if this is an iOS device
  const isIOS = browserDetection.isIOS();
  const isPWA = iosPwaDetection.isRunningAsPwa();
  const iosSupport = checkIOSPushSupport();
  
  // Should show PWA installation prompt
  const shouldPromptPwaInstall = isIOS && !isPWA;
  
  // Start permission request flow
  const startPermissionFlow = useCallback(async () => {
    if (isRequesting) return null; // Don't allow multiple simultaneous requests
    
    try {
      setIsRequesting(true);
      const result = await requestPermission();
      setLastResult(result);
      return result;
    } catch (error) {
      const errorResult = { 
        granted: false, 
        error: error instanceof Error ? error : String(error)
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsRequesting(false);
    }
  }, [isRequesting, requestPermission]);
  
  return {
    // States
    permissionGranted,
    isRequesting,
    lastResult,
    isIOS,
    isPWA,
    iosSupport,
    shouldPromptPwaInstall,
    isSupported,
    
    // Actions
    startPermissionFlow
  };
}

export default useIOSPermissionFlow;
