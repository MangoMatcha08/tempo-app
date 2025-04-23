import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, GetTokenOptions } from 'firebase/messaging';
import { firebaseConfig } from '@/lib/firebase/config';
import { FirebaseMessagingPayload } from '@/types/notifications/serviceWorkerTypes';
import { sendTestNotification } from '@/lib/firebase/functions';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { getAuth } from 'firebase/auth';
import { initializeFirebase, messaging, firestore, vapidKey } from '@/services/notifications/firebase';
import { saveTokenToFirestore } from '@/services/notifications/tokenManager';
import { defaultNotificationSettings } from '@/types/notifications/settingsTypes';

// Extended GetTokenOptions interface to include forceRefresh
interface ExtendedGetTokenOptions extends GetTokenOptions {
  forceRefresh?: boolean;
}

// Initialize Firebase app if it hasn't been initialized already
let messaging: any;

try {
  if (typeof window !== 'undefined') {
    const firebaseApp = initializeApp(firebaseConfig);
    messaging = getMessaging(firebaseApp);
  }
} catch (error) {
  console.error('Error initializing Firebase Messaging:', error);
}

/**
 * Sets up a listener for messages while the app is in the foreground
 * @param callback Function to be called when a message is received
 * @returns Unsubscribe function
 */
const setupForegroundMessageListener = (
  callback: (payload: FirebaseMessagingPayload) => void
): (() => void) => {
  if (!messaging) {
    console.warn('Messaging not initialized, cannot setup foreground listener');
    return () => {};
  }

  try {
    // Set up message handler
    const unsubscribe = onMessage(messaging, (payload: any) => {
      console.log('Received foreground message:', payload);
      
      // Call the provided callback
      callback(payload);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return () => {};
  }
};

/**
 * Gets the FCM token for the current device with special handling for iOS
 */
const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Messaging not initialized, cannot get FCM token');
    return null;
  }
  
  try {
    // For iOS we need to ensure service worker is ready and token options are correct
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('token-request-start');
      
      // iOS requires the service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      
      // Get token with iOS-specific options
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
        forceRefresh: true
      } as ExtendedGetTokenOptions);
      
      if (currentToken) {
        iosPushLogger.logPushEvent('token-received', { 
          tokenPrefix: currentToken.substring(0, 5) + '...'
        });
        return currentToken;
      } else {
        iosPushLogger.logPushEvent('token-empty');
        return null;
      }
    } else {
      // Standard token request for other browsers
      const currentToken = await getToken(messaging, {
        vapidKey
      });
      
      if (currentToken) {
        console.log('FCM Token:', currentToken.substring(0, 5) + '...');
        return currentToken;
      } else {
        console.log('No registration token available');
        return null;
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error getting FCM token:', errorMsg);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('token-error', { error: errorMsg });
    }
    
    return null;
  }
};

/**
 * Request permission and get FCM token
 * @returns Promise with the FCM token
 */
const requestNotificationPermission = async (): Promise<string | null> => {
  // Check if notifications are supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return null;
  }
  
  try {
    // For iOS, log the permission flow
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('request-start', {
        currentPermission: Notification.permission
      });
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // For iOS, log the successful permission
      if (browserDetection.isIOS()) {
        iosPushLogger.logPermissionEvent('granted');
      }
      
      // Get FCM token
      return await getFCMToken();
    }
    
    // For iOS, log the denied permission
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('denied');
    }
    
    return null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error requesting notification permission:', errorMsg);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('error', { error: errorMsg });
    }
    
    return null;
  }
};

// Export all functions
export {
  getFCMToken,
  setupForegroundMessageListener,
  requestNotificationPermission,
  sendTestNotification
};
