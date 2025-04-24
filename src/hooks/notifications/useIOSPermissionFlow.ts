
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
import { getErrorMessage } from '@/types/errors/types';

export function useIOSPermissionFlow() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  
  // Check iOS support and PWA status
  const iosSupport = checkIOSPushSupport();
  const isPWA = iosPwaDetection.isRunningAsPwa();
  
  const startPermissionFlow = useCallback(async (): Promise<PermissionRequestResult | null> => {
    setIsRequesting(true);
    setFlowError(null);
    
    try {
      if (shouldResumeFlow()) {
        return await resumePermissionFlow();
      }
      
      return await requestIOSPushPermission();
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setFlowError(errorMessage);
      return {
        granted: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        reason: 'flow-failed'
      };
    } finally {
      setIsRequesting(false);
    }
  }, []);
  
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

