
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, GetTokenOptions } from 'firebase/messaging';
import { firebaseConfig } from '@/lib/firebase/config';
import { FirebaseMessagingPayload } from '@/types/notifications/serviceWorkerTypes';
import { sendTestNotification } from '@/lib/firebase/functions';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';

// Extended GetTokenOptions interface to include forceRefresh
interface ExtendedGetTokenOptions extends GetTokenOptions {
  forceRefresh?: boolean;
}

// Initialize Firebase app if it hasn't been initialized already
let messaging: any;
let initializationError: Error | null = null;

try {
  if (typeof window !== 'undefined') {
    const firebaseApp = initializeApp(firebaseConfig);
    messaging = getMessaging(firebaseApp);
  }
} catch (error) {
  console.error('Error initializing Firebase Messaging:', error);
  initializationError = error instanceof Error ? error : new Error(String(error));
}

/**
 * Sets up a listener for messages while the app is in the foreground
 * @param callback Function to be called when a message is received
 * @returns Unsubscribe function
 */
export const setupForegroundMessageListener = (
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
 * @returns Promise with the token
 */
export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Messaging not initialized, cannot get FCM token', initializationError);
    throw new Error(`Firebase messaging not initialized: ${initializationError?.message || 'Unknown error'}`);
  }
  
  try {
    // For iOS we need to ensure service worker is ready and token options are correct
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('token-request-start');
      
      // iOS requires the service worker to be ready
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('Service worker ready:', registration.scope);
      } catch (swError) {
        console.error('Error with service worker:', swError);
        iosPushLogger.logPushEvent('sw-error', { error: String(swError) });
        throw new Error(`Service worker error: ${swError instanceof Error ? swError.message : String(swError)}`);
      }
      
      // iOS Safari needs VAPID key without padding
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 
        'BJ9HWzAxfk1jKtkGfoKYMauaVfMatIkqw0cCEwQ1WBH7cn5evFO_saWfpvXAVy5710DTOpSUoXsKk8LWGQK7lBU';
      
      console.log('Using VAPID key:', vapidKey?.substring(0, 10) + '...');
      
      // Remove any potential padding for iOS
      const formattedVapidKey = vapidKey.replace(/=/g, '');
      
      // Get token with iOS-specific options
      const tokenOptions: ExtendedGetTokenOptions = {
        vapidKey: formattedVapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.ready,
        forceRefresh: true
      };
      
      console.log('Requesting token with options:', JSON.stringify({
        vapidKey: tokenOptions.vapidKey?.substring(0, 10) + '...',
        swScope: tokenOptions.serviceWorkerRegistration.scope,
        forceRefresh: tokenOptions.forceRefresh
      }));
      
      const currentToken = await getToken(messaging, tokenOptions);
      
      if (currentToken) {
        iosPushLogger.logPushEvent('token-received', { 
          tokenPrefix: currentToken.substring(0, 5) + '...'
        });
        return currentToken;
      } else {
        iosPushLogger.logPushEvent('token-empty');
        throw new Error('Token request succeeded but returned empty token');
      }
    } else {
      // Standard token request for other browsers
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      if (currentToken) {
        console.log('FCM Token:', currentToken.substring(0, 5) + '...');
        return currentToken;
      } else {
        console.log('No registration token available');
        throw new Error('Token request succeeded but returned empty token');
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error getting FCM token:', errorMsg);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('token-error', { error: errorMsg });
    }
    
    throw error; // Re-throw to propagate error up
  }
};

/**
 * Request permission and get FCM token
 * @returns Promise with the FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  // Check if notifications are supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    throw new Error('Notifications not supported in this browser');
  }
  
  try {
    // For iOS, log the permission flow
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('request-start', {
        currentPermission: Notification.permission
      });
    }
    
    // Request permission
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Permission result:', permission);
    
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
    
    throw new Error(`Notification permission ${permission}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error requesting notification permission:', errorMsg);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('error', { error: errorMsg });
    }
    
    throw error; // Re-throw to propagate error up
  }
};

/**
 * Save FCM token to Firestore
 */
export const saveTokenToFirestore = async (userId: string, token: string): Promise<void> => {
  // Implementation would go here
  console.log(`Saving token ${token.substring(0, 5)}... for user ${userId}`);
};

/**
 * Sends a test notification using the Firebase sendTestNotification function
 * @param options Test notification options
 * @returns Promise with the test result
 */
export const sendTestMessage = async (options: { 
  type: 'push' | 'email';
  email?: string;
  includeDeviceInfo?: boolean;
}): Promise<any> => {
  try {
    console.log('Preparing to send test notification with options:', options);
    
    // For iOS, add device info and log the test attempt
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('test-notification-request', { options });
      
      // Always include device info for iOS for debugging
      options.includeDeviceInfo = true;
    }
    
    // Get current FCM token if this is a push notification
    if (options.type === 'push') {
      try {
        const currentToken = await getFCMToken();
        console.log('Current FCM token for test:', currentToken ? `${currentToken.substring(0, 5)}...` : 'No token');
        
        // If we got this far but don't have a token, that's a problem
        if (!currentToken) {
          throw new Error('No FCM token available for push notification test');
        }
      } catch (tokenError) {
        console.error('Error getting token for test notification:', tokenError);
        throw tokenError;
      }
    }
    
    // Send the test notification
    console.log('Sending test notification via Firebase function');
    const result = await sendTestNotification(options);
    console.log('Test notification result:', result);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('test-notification-result', { result });
    }
    
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error sending test notification:', errorMsg);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('test-notification-error', { 
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    throw error;
  }
};

// Get messaging initialization status
export const getMessagingStatus = () => {
  return {
    initialized: !!messaging,
    error: initializationError ? initializationError.message : null
  };
};

// Export necessary functions
export {
  sendTestMessage as sendTestNotification
};
