/**
 * Hook for iOS permission flow
 * 
 * Updated to use the refactored permission utilities
 */

import { useState, useCallback } from 'react';
import { 
  requestIOSPushPermission, 
  checkIOSPushSupport, 
  resumePermissionFlow,
  checkBrowserCapabilities 
} from '@/utils/iosPermissionUtils';
import { browserDetection } from '@/utils/browserDetection';
import { iosPwaDetection } from '@/utils/iosPwaDetection';
import { shouldResumeFlow } from '@/utils/iosPermissionFlowState';
import { PermissionRequestResult } from '@/types/notifications';

/**
 * Hook for managing the iOS permission flow
 */
export function useIOSPermissionFlow() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  
  // Check iOS support and PWA status
  const iosSupport = checkIOSPushSupport();
  const isPWA = iosPwaDetection.isRunningAsPwa();
  
  // Start the permission flow
  const startPermissionFlow = useCallback(async (): Promise<PermissionRequestResult | null> => {
    setIsRequesting(true);
    setFlowError(null);
    
    try {
      // Check if we need to resume an interrupted flow
      if (shouldResumeFlow()) {
        return await resumePermissionFlow();
      }
      
      // Start a new permission flow
      return await requestIOSPushPermission();
      
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : String(error));
      return {
        granted: false,
        error: error instanceof Error ? error : new Error('Failed to start permission flow'),
        reason: 'flow-failed'
      };
    } finally {
      setIsRequesting(false);
    }
  }, []);
  
  // Return values
  return {
    isRequesting,
    startPermissionFlow,
    flowError,
    isPWA,
    iosSupport,
    shouldPromptPwaInstall: !isPWA && browserDetection.isIOS()
  };
}

export default useIOSPermissionFlow;
