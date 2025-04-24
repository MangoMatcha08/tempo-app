
/**
 * Hook for iOS permission flow
 * 
 * Updated to use the enhanced permission utilities with retry and error classification
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  requestIOSPushPermission, 
  checkIOSPushSupport, 
  resumePermissionFlow,
  checkBrowserCapabilities 
} from '@/utils/iosPermissionUtils';
import { browserDetection } from '@/utils/browserDetection';
import { iosPwaDetection } from '@/utils/iosPwaDetection';
import { 
  shouldResumeFlow, 
  getFlowState, 
  getFlowDuration, 
  PermissionFlowStep 
} from '@/utils/iosPermissionFlowState';
import { PermissionRequestResult } from '@/types/notifications';
import { 
  shouldAllowRetry, 
  getTimeUntilRetry, 
  getAttemptHistory 
} from '@/utils/iosPermissionRetry';
import { PermissionErrorType } from '@/types/notifications/errorTypes';
import { startEventTiming, recordTelemetryEvent } from '@/utils/iosPushTelemetry';
import { createMetadata } from '@/utils/telemetryUtils';

/**
 * Hook for managing the iOS permission flow with enhanced retry and error handling
 */
export function useIOSPermissionFlow() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [retryInfo, setRetryInfo] = useState({
    canRetry: true,
    nextRetryTime: 0,
    attemptCount: 0
  });
  
  // Check iOS support and PWA status
  const iosSupport = checkIOSPushSupport();
  const isPWA = iosPwaDetection.isRunningAsPwa();
  
  // Update retry information periodically
  useEffect(() => {
    const updateRetryInfo = () => {
      const canRetry = shouldAllowRetry();
      const nextRetryTime = getTimeUntilRetry();
      const attemptHistory = getAttemptHistory();
      
      setRetryInfo({
        canRetry,
        nextRetryTime,
        attemptCount: attemptHistory.count
      });
    };
    
    // Initial update
    updateRetryInfo();
    
    // Update every 30 seconds
    const intervalId = setInterval(updateRetryInfo, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Start the permission flow with enhanced error handling and telemetry
  const startPermissionFlow = useCallback(async (): Promise<PermissionRequestResult | null> => {
    // Don't allow if we can't retry yet
    if (!retryInfo.canRetry) {
      setFlowError(`Too many attempts. Please try again in ${Math.ceil(retryInfo.nextRetryTime / 60000)} minutes.`);
      
      return {
        granted: false,
        error: new Error('Too many attempts'),
        reason: PermissionErrorType.MULTIPLE_ATTEMPTS_FAILED
      };
    }
    
    setIsRequesting(true);
    setFlowError(null);
    
    // Start flow timing
    const flowTimer = startEventTiming('ios-permission-flow');
    flowTimer.addData({
      isPWA,
      iosVersion: browserDetection.getIOSVersion(),
      browserCapabilities: checkBrowserCapabilities(),
      attemptCount: retryInfo.attemptCount
    });
    
    try {
      // Check if we need to resume an interrupted flow
      if (shouldResumeFlow()) {
        const flowState = getFlowState();
        
        flowTimer.addData({
          resuming: true,
          previousStep: flowState?.step,
          flowDuration: getFlowDuration()
        });
        
        recordTelemetryEvent({
          eventType: 'flow-resumed',
          isPWA,
          iosVersion: browserDetection.getIOSVersion()?.toString(),
          timestamp: Date.now(),
          metadata: createMetadata('Flow resumed', {
            previousStep: flowState?.step,
            flowDuration: getFlowDuration()
          })
        });
        
        const result = await resumePermissionFlow();
        
        // Log completion
        flowTimer.completeEvent(
          result.granted ? 'success' : 'failure', 
          createMetadata('Flow completed', {
            result: result.granted ? 'success' : 'failure',
            resumed: true,
            errorType: result.granted ? undefined : result.reason
          })
        );
        
        setIsRequesting(false);
        
        if (!result.granted) {
          setFlowError(result.error ? result.error.message : result.reason || 'Permission request failed');
        }
        
        return result;
      }
      
      // Start a new permission flow
      const result = await requestIOSPushPermission();
      
      // Log completion
      flowTimer.completeEvent(
        result.granted ? 'success' : 'failure',
        createMetadata('Flow completed', {
          result: result.granted ? 'success' : 'failure',
          errorType: result.granted ? undefined : result.reason
        })
      );
      
      setIsRequesting(false);
      
      if (!result.granted) {
        setFlowError(result.error ? result.error.message : result.reason || 'Permission request failed');
      }
      
      return result;
      
    } catch (error) {
      // Handle unexpected errors
      flowTimer.completeEvent('error', createMetadata('Flow error', {
        error: error instanceof Error ? error.message : String(error)
      }));
      
      setFlowError(error instanceof Error ? error.message : String(error));
      setIsRequesting(false);
      
      return {
        granted: false,
        error: error instanceof Error ? error : new Error('Failed to start permission flow'),
        reason: PermissionErrorType.UNKNOWN_ERROR
      };
    }
  }, [retryInfo.canRetry, retryInfo.nextRetryTime, retryInfo.attemptCount, isPWA]);
  
  // Return values
  return {
    isRequesting,
    startPermissionFlow,
    flowError,
    isPWA,
    iosSupport,
    shouldPromptPwaInstall: !isPWA && browserDetection.isIOS(),
    
    // Enhanced retry information
    retryInfo: {
      canRetry: retryInfo.canRetry,
      nextRetryTime: retryInfo.nextRetryTime,
      attemptCount: retryInfo.attemptCount,
      waitTimeMinutes: Math.ceil(retryInfo.nextRetryTime / 60000)
    }
  };
}

export default useIOSPermissionFlow;
