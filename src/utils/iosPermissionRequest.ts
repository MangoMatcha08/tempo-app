
/**
 * iOS Permission Request Orchestrator
 * Coordinates the complete permission request flow
 */

import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { PermissionFlowStep, saveFlowState } from './iosPermissionFlowState';
import { getCurrentDeviceTimingConfig, sleep } from './iosPermissionTimings';
import { checkIOSPushSupport } from './iosPermissionHelper';
import { PermissionRequestResult, PermissionErrorReason } from '@/types/notifications';
import { requestBasicPermission } from '@/services/notifications/permissionCore';
import { ensureServiceWorker } from '@/services/notifications/ServiceWorkerManager';
import { requestFCMToken } from '@/services/notifications/tokenManager';
import { initializeFirebase, vapidKey } from '@/services/notifications/firebase';

/**
 * Request iOS push notification permission with optimized flow
 */
export async function requestIOSPushPermission(): Promise<PermissionRequestResult> {
  try {
    // Check if iOS push is supported
    const support = checkIOSPushSupport();
    if (!support.supported) {
      return { 
        granted: false, 
        reason: support.reason === 'iOS version too low' 
          ? PermissionErrorReason.IOS_VERSION_UNSUPPORTED 
          : PermissionErrorReason.NOT_PWA
      };
    }

    // Start the flow
    const timingConfig = getCurrentDeviceTimingConfig();
    if (!timingConfig) {
      throw new Error('Failed to get timing configuration');
    }

    // Initialize Firebase
    const { messaging } = await initializeFirebase();
    if (!messaging) {
      throw new Error('Firebase messaging initialization failed');
    }

    // Request permission
    const permissionResult = await requestBasicPermission();
    if (!permissionResult.granted) {
      return permissionResult;
    }

    // Register service worker
    const serviceWorkerRegistration = await ensureServiceWorker(timingConfig.flowTimeout);
    
    // Request FCM token
    saveFlowState(PermissionFlowStep.TOKEN_REQUESTED);
    await sleep(timingConfig.tokenRequestDelay);
    
    const token = await requestFCMToken({
      vapidKey,
      serviceWorkerRegistration
    });

    // Flow complete
    saveFlowState(PermissionFlowStep.COMPLETE);
    
    return {
      granted: true,
      token
    };

  } catch (error) {
    iosPushLogger.logPermissionStep('unexpected-error', {
      error: error instanceof Error ? error.message : String(error)
    });

    saveFlowState(PermissionFlowStep.ERROR, {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      granted: false,
      error: error instanceof Error ? error : new Error('Unexpected error in permission flow'),
      reason: PermissionErrorReason.UNKNOWN_ERROR
    };
  }
}

// Re-export helper for convenience
export { checkIOSPushSupport } from './iosPermissionHelper';

