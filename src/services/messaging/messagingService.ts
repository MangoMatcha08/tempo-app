
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from '@/lib/firebase/config';
import { FirebaseMessagingPayload } from '@/types/notifications/serviceWorkerTypes';
import { sendTestNotification } from '@/lib/firebase/functions';

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
 * Gets the FCM token for the current device
 * @returns Promise with the token
 */
export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Messaging not initialized, cannot get FCM token');
    return null;
  }
  
  try {
    // Get token
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    
    if (currentToken) {
      // Save the token to your backend
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
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
    return await sendTestNotification(options);
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};
