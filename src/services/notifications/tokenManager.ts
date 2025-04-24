
/**
 * Firebase token management for push notifications
 */

import { getMessaging, getToken } from 'firebase/messaging';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { browserDetection } from '@/utils/browserDetection';
import { getCurrentDeviceTimingConfig, withRetry } from '@/utils/iosPermissionTimings';
import { saveTokenToFirestore } from '@/services/notifications/messaging';

interface TokenRequestOptions {
  vapidKey: string;
  serviceWorkerRegistration: ServiceWorkerRegistration;
}

/**
 * Request FCM token with enhanced error handling
 */
export async function requestFCMToken(options: TokenRequestOptions): Promise<string> {
  const messaging = getMessaging();
  const timingConfig = getCurrentDeviceTimingConfig();
  
  // Use withRetry for token acquisition
  const token = await withRetry(
    async () => {
      return await getToken(messaging, {
        vapidKey: options.vapidKey,
        serviceWorkerRegistration: options.serviceWorkerRegistration
      });
    },
    {
      maxRetries: browserDetection.isIOS() ? 3 : 2,
      retryPredicate: (error) => {
        // Retry on specific errors
        const shouldRetry = error.code === 'messaging/token-request-failed' ||
                          error.code === 'messaging/network-error';
        
        iosPushLogger.logPushEvent('token-retry-decision', {
          error: error.message,
          shouldRetry
        });
        
        return shouldRetry;
      }
    }
  );

  if (!token) {
    throw new Error('Token request returned empty result');
  }

  // Save token to user's document in Firestore
  const userId = localStorage.getItem('userId') || 'anonymous';
  await saveTokenToFirestore(userId, token);

  return token;
}

/**
 * Validate FCM token format
 */
export function validateToken(token: string): boolean {
  return token && typeof token === 'string' && token.length >= 50;
}

