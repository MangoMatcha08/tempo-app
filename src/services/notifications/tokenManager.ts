/**
 * Firebase token management for push notifications
 */

import { getMessaging, getToken } from 'firebase/messaging';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { browserDetection } from '@/utils/browserDetection';
import { getCurrentDeviceTimingConfig, withRetry } from '@/utils/iosPermissionTimings';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/services/notifications/firebase';
import { defaultNotificationSettings } from '@/types/notifications/settingsTypes';

interface TokenRequestOptions {
  vapidKey: string;
  serviceWorkerRegistration: ServiceWorkerRegistration;
}

/**
 * Save FCM token to Firestore with authentication check
 */
export const saveTokenToFirestore = async (userId: string, token: string): Promise<void> => {
  if (!firestore) return;
  
  const auth = getAuth();
  if (!auth.currentUser) {
    console.error('Attempted to save token without authentication');
    return;
  }

  // Ensure the userId matches the authenticated user
  if (userId !== auth.currentUser.uid) {
    console.error('User ID mismatch when saving token');
    return;
  }
  
  try {
    console.log(`Saving token for authenticated user ${userId}`);
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Update existing user document
      const fcmTokens = userDoc.data().fcmTokens || {};
      fcmTokens[token] = true;
      
      await updateDoc(userDocRef, {
        fcmTokens,
        updatedAt: new Date()
      });
      console.log('Updated existing user document with token');
    } else {
      // Create new user document
      await setDoc(userDocRef, {
        fcmTokens: { [token]: true },
        notificationSettings: defaultNotificationSettings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created new user document with token');
    }
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
  }
};

/**
 * Request FCM token with enhanced error handling and authentication check
 */
export async function requestFCMToken(options: TokenRequestOptions): Promise<string> {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to register for notifications');
  }

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

  // Save token to user's document in Firestore using authenticated user ID
  await saveTokenToFirestore(auth.currentUser.uid, token);

  return token;
}

/**
 * Validate FCM token format
 */
export function validateToken(token: string): boolean {
  return token && typeof token === 'string' && token.length >= 50;
}
