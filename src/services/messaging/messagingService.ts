import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, GetTokenOptions } from 'firebase/messaging';
import { firebaseConfig } from '@/lib/firebase/config';
import { FirebaseMessagingPayload } from '@/types/notifications/serviceWorkerTypes';
import { sendTestNotification } from '@/lib/firebase/functions';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase, messaging, firestore, vapidKey } from './firebase';
import { defaultNotificationSettings } from '@/types/notifications/settingsTypes';
import { httpsCallable, getFunctions, connectFunctionsEmulator } from 'firebase/functions';

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
 * @returns Promise with the token
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
      
      // iOS Safari needs VAPID key without padding
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 
        'BJ9HWzAxfk1jKtkGfoKYMauaVfMatIkqw0cCEwQ1WBH7cn5evFO_saWfpvXAVy5710DTOpSUoXsKk8LWGQK7lBU';
      
      // Remove any potential padding for iOS
      const formattedVapidKey = vapidKey.replace(/=/g, '');
      
      // Get token with iOS-specific options
      const currentToken = await getToken(messaging, {
        vapidKey: formattedVapidKey,
        serviceWorkerRegistration: registration,
        forceRefresh: true // Using the extended interface
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
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
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

/**
 * Save FCM token to Firestore with authentication check
 */
export const saveTokenToFirestore = async (userId: string, token: string): Promise<void> => {
  await initializeFirebase();
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
 * Sends a test notification using the Firebase sendTestNotification function
 * @param options Test notification options
 * @returns Promise with the test result
 */
const sendTestMessage = async (options: { 
  type: 'push' | 'email';
  email?: string;
  includeDeviceInfo?: boolean;
}): Promise<any> => {
  try {
    // For iOS, add device info and log the test attempt
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('test-notification-request', { options });
      
      // Always include device info for iOS for debugging
      options.includeDeviceInfo = true;
    }
    
    console.log("Sending test message with options:", options);
    // Import directly here to avoid circular dependency
    const { sendTestNotification } = await import('@/lib/firebase/functions');
    const result = await sendTestNotification(options);
    
    console.log("Test notification result:", result);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('test-notification-result', { result });
    }
    
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error sending test notification:', errorMsg);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('test-notification-error', { error: errorMsg });
    }
    
    throw error;
  }
};

// Export all functions
export {
  getFCMToken,
  setupForegroundMessageListener,
  requestNotificationPermission,
  saveTokenToFirestore,
  sendTestMessage as sendTestNotification
};
