import { getMessaging, getToken } from 'firebase/messaging';
import { iosPushLogger } from './iosPushLogger';
import { browserDetection } from './browserDetection';
import { getCurrentDeviceTimingConfig, withRetry } from './iosPermissionTimings';
import { firestore } from '@/services/notifications/core/initialization';
import { PermissionRequestResult } from '@/types/notifications';
import { RetryOptions } from './retryUtils';

interface TokenRequestOptions {
  vapidKey: string;
  serviceWorkerRegistration: ServiceWorkerRegistration;
}

interface RetryConfig extends RetryOptions {
  delay?: number;
  baseDelayMs?: number;
  backoffFactor?: number;
}

export async function requestIOSPushPermission(): Promise<PermissionRequestResult> {
  if (!browserDetection.isIOS()) {
    return {
      granted: false,
      reason: 'Not an iOS device'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        granted: false,
        reason: 'Permission denied'
      };
    }

    return {
      granted: true
    };
  } catch (error) {
    return {
      granted: false,
      error: error instanceof Error ? error : new Error('Permission request failed'),
      reason: 'Permission request failed'
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

  try {
    iosPushLogger.logPushEvent('token-request-start', { timingConfig });

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
      return null;
    }

    iosPushLogger.logPushEvent('token-received', { tokenPrefix: token.substring(0, 5) + '...' });
    return token;
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    iosPushLogger.logPushEvent('token-error', { error: errorMsg });
    return null;
  }
}
