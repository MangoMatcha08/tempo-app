/**
 * iOS Push Notification Telemetry
 */
import { getMessaging, getToken } from 'firebase/messaging';
import { iosPushLogger } from './iosPushLogger';
import { browserDetection } from './browserDetection';
import { getCurrentDeviceTimingConfig, withRetry } from './iosPermissionTimings';
import { startEventTiming } from './iosPushTelemetry';
import { firestore } from '@/services/notifications/core/initialization';
import { PermissionRequestResult } from '@/types/notifications';
import { RetryOptions } from './retryUtils';
import { 
  saveFlowState, 
  clearFlowState, 
  PermissionFlowStep 
} from './iosPermissionFlowState';
import { createMetadata } from './telemetryUtils';
import { 
  PermissionErrorType, 
  getDeviceCapabilities, 
  createPermissionErrorMetadata,
  shouldAllowRetry,
  getAttemptHistory,
  recordFailedAttempt
} from './iosPermissionRetry';

interface TokenRequestOptions {
  vapidKey: string;
  serviceWorkerRegistration: ServiceWorkerRegistration;
}

interface RetryConfig extends RetryOptions {
  delay?: number;
  baseDelayMs?: number;
  backoffFactor?: number;
}

/**
 * Request iOS push permission with enhanced error handling and retry logic
 */
export async function requestIOSPushPermission(): Promise<PermissionRequestResult> {
  if (!browserDetection.isIOS()) {
    return {
      granted: false,
      reason: PermissionErrorType.NOT_IOS_DEVICE
    };
  }

  // Check if we should allow a retry attempt
  if (!shouldAllowRetry()) {
    const attemptHistory = getAttemptHistory();
    return {
      granted: false,
      reason: PermissionErrorType.MULTIPLE_ATTEMPTS_FAILED,
      error: new Error(`Too many failed attempts (${attemptHistory.count}), please try again later`),
      metadata: createPermissionErrorMetadata(PermissionErrorType.MULTIPLE_ATTEMPTS_FAILED, {
        recoverable: true,
        transient: false,
        additionalData: { attemptCount: attemptHistory.count }
      }).data
    };
  }

  const telemetryTimer = startEventTiming('ios-permission-request');
  
  try {
    // Check device capabilities
    const deviceCapabilities = getDeviceCapabilities();
    
    // Save capabilities in telemetry
    telemetryTimer.addData({
      deviceCapabilities,
      attemptHistory: getAttemptHistory()
    });
    
    // Start permission flow
    saveFlowState(PermissionFlowStep.INITIAL);
    
    // Request permission
    const permission = await Notification.requestPermission();
    saveFlowState(PermissionFlowStep.PERMISSION_REQUESTED);
    
    if (permission !== 'granted') {
      clearFlowState();
      
      // Determine specific error type
      const errorType = permission === 'denied' 
        ? PermissionErrorType.PERMISSION_DENIED 
        : PermissionErrorType.PERMISSION_DISMISSED;
      
      // Record the failed attempt
      recordFailedAttempt(errorType, `Permission response: ${permission}`);
      
      // Complete telemetry with enhanced metadata
      telemetryTimer.completeEvent('failure', createPermissionErrorMetadata(errorType, {
        recoverable: errorType === PermissionErrorType.PERMISSION_DISMISSED,
        transient: errorType === PermissionErrorType.PERMISSION_DISMISSED,
        additionalData: { permission }
      }));
      
      return {
        granted: false,
        reason: errorType,
        metadata: createMetadata('Permission denied', {
          permission,
          errorType,
          recoverable: errorType === PermissionErrorType.PERMISSION_DISMISSED
        }).data
      };
    }
    
    saveFlowState(PermissionFlowStep.PERMISSION_GRANTED);
    
    return {
      granted: true,
      metadata: createMetadata('Permission granted', {
        deviceCapabilities,
        flowDuration: Date.now() - telemetryTimer.getStartTime()
      }).data
    };
  } catch (error) {
    clearFlowState();
    
    // Determine error type
    let errorType = PermissionErrorType.UNKNOWN_ERROR;
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Classify based on error message
    if (errorMsg.includes('network') || errorMsg.includes('offline')) {
      errorType = PermissionErrorType.NETWORK_OFFLINE;
    } else if (errorMsg.includes('timeout')) {
      errorType = PermissionErrorType.NETWORK_TIMEOUT;
    } else if (errorMsg.includes('service worker')) {
      errorType = PermissionErrorType.SW_REGISTRATION_FAILED;
    } else if (errorMsg.includes('iOS version')) {
      errorType = PermissionErrorType.VERSION_UNSUPPORTED;
    } else if (errorMsg.includes('PWA')) {
      errorType = PermissionErrorType.NOT_PWA;
    }
    
    // Record the failed attempt
    recordFailedAttempt(errorType, errorMsg);
    
    // Complete telemetry with enhanced metadata
    telemetryTimer.completeEvent('error', createPermissionErrorMetadata(errorType, {
      recoverable: errorType !== PermissionErrorType.VERSION_UNSUPPORTED,
      transient: [
        PermissionErrorType.NETWORK_OFFLINE, 
        PermissionErrorType.NETWORK_TIMEOUT
      ].includes(errorType),
      additionalData: { errorMessage: errorMsg }
    }));
    
    return {
      granted: false,
      error: error instanceof Error ? error : new Error(errorMsg),
      reason: errorType,
      metadata: createPermissionErrorMetadata('Permission error', {
        errorType,
        errorMessage: errorMsg,
        deviceCapabilities: getDeviceCapabilities(),
        recoverable: errorType !== PermissionErrorType.VERSION_UNSUPPORTED
      }).data
    };
  }
}

/**
 * Requests an FCM token with retry logic and timing considerations for iOS.
 * @param options - Configuration options including VAPID key and service worker registration.
 * @returns A promise that resolves with the FCM token or null if the request fails.
 */
export async function requestIosFCMToken(options: TokenRequestOptions): Promise<string | null> {
  if (!options.vapidKey || !options.serviceWorkerRegistration) {
    iosPushLogger.logPushEvent('token-config-missing', {
      hasVapidKey: !!options.vapidKey,
      hasServiceWorker: !!options.serviceWorkerRegistration
    });
    return null;
  }

  const messaging = getMessaging();
  const timingConfig = getCurrentDeviceTimingConfig();
  const telemetryTimer = startEventTiming('ios-fcm-token-request');

  try {
    // Add device capabilities to telemetry
    telemetryTimer.addData({
      deviceCapabilities: getDeviceCapabilities(),
      timingConfig
    });
    
    iosPushLogger.logPushEvent('token-request-start', { timingConfig });
    saveFlowState(PermissionFlowStep.TOKEN_REQUESTED);

    const token = await withRetry(
      async () => {
        return await getToken(messaging, {
          vapidKey: options.vapidKey,
          serviceWorkerRegistration: options.serviceWorkerRegistration
        });
      },
      {
        maxRetries: browserDetection.isIOS() ? 3 : 2,
        delay: timingConfig?.tokenRequestDelay || 1000,
        retryPredicate: (error) => {
          const shouldRetry = error.code === 'messaging/token-request-failed' ||
                            error.code === 'messaging/network-error';

          iosPushLogger.logPushEvent('token-retry-decision', {
            error: error.message,
            shouldRetry
          });

          return shouldRetry;
        }
      } as RetryConfig
    );

    if (!token) {
      iosPushLogger.logPushEvent('token-empty');
      telemetryTimer.completeEvent('failure', createPermissionErrorMetadata(
        PermissionErrorType.TOKEN_FETCH_FAILED, 
        { additionalData: { reason: 'Token is empty' }}
      ));
      return null;
    }

    iosPushLogger.logPushEvent('token-received', { tokenPrefix: token.substring(0, 5) + '...' });
    telemetryTimer.completeEvent('success', createMetadata('Token received', {
      tokenLength: token.length,
      requestDuration: Date.now() - telemetryTimer.getStartTime()
    }));
    
    return token;
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    iosPushLogger.logPushEvent('token-error', { error: errorMsg });
    
    // Determine error type
    let errorType = PermissionErrorType.TOKEN_FETCH_FAILED;
    if (errorMsg.includes('network') || error.code === 'messaging/network-error') {
      errorType = PermissionErrorType.NETWORK_OFFLINE;
    } else if (errorMsg.includes('timeout')) {
      errorType = PermissionErrorType.NETWORK_TIMEOUT;
    } else if (errorMsg.includes('expired')) {
      errorType = PermissionErrorType.TOKEN_EXPIRED;
    }
    
    telemetryTimer.completeEvent('error', createPermissionErrorMetadata(errorType, {
      additionalData: { errorMessage: errorMsg, errorCode: error.code }
    }));
    
    return null;
  }
}
