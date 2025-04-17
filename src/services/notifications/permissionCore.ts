
/**
 * Core permission request functionality
 * Handles the basic permission request flow without token or service worker concerns
 */

import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { PermissionRequestResult, PermissionErrorReason } from '@/types/notifications';
import { saveFlowState, PermissionFlowStep } from '@/utils/iosPermissionFlowState';
import { getCurrentDeviceTimingConfig, sleep, timeout } from '@/utils/iosPermissionTimings';

/**
 * Request basic notification permission
 * Handles only the permission request, not tokens or service workers
 */
export async function requestBasicPermission(): Promise<PermissionRequestResult> {
  try {
    const timingConfig = getCurrentDeviceTimingConfig();
    if (!timingConfig) {
      throw new Error('Failed to get timing configuration');
    }

    // Small delay before permission request (helps on iOS)
    await sleep(timingConfig.prePermissionDelay);

    // Update flow state
    saveFlowState(PermissionFlowStep.PERMISSION_REQUESTED);
    
    // Request permission with timeout
    const permissionResult = await timeout(
      Notification.requestPermission(),
      timingConfig.flowTimeout,
      'Permission request timed out'
    );

    iosPushLogger.logPermissionStep('permission-response', {
      result: permissionResult
    });

    if (permissionResult !== 'granted') {
      return {
        granted: false,
        reason: PermissionErrorReason.PERMISSION_DENIED
      };
    }

    // Update state and wait after permission granted
    saveFlowState(PermissionFlowStep.PERMISSION_GRANTED);
    await sleep(timingConfig.postPermissionDelay);

    return { granted: true };
  } catch (error) {
    iosPushLogger.logPermissionStep('permission-request-error', {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      granted: false,
      error: error instanceof Error ? error : new Error('Permission request failed'),
      reason: PermissionErrorReason.PERMISSION_REQUEST_FAILED
    };
  }
}

