/**
 * Firebase Cloud Messaging Service
 * 
 * Handles push notification registration and message handling
 * 
 * @module services/messaging/messagingService
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseApp } from '@/lib/firebase/firebase';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';

// Debug flag for messaging service
export const DEBUG_MESSAGING = true;

// Vapid key for web push
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Initialize Firebase Cloud Messaging
 * @returns Promise that resolves with the FCM token or null if not available
 */
export async function initializeMessaging(): Promise<string | null> {
  try {
    if (!firebaseApp) {
      console.error('Firebase app not initialized');
      return null;
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      if (DEBUG_MESSAGING) console.log('Service workers not supported');
      return null;
    }

    // Special handling for iOS
    if (browserDetection.isIOS()) {
      const iosVersion = browserDetection.getIOSVersion();
      const isPWA = browserDetection.isIOSPWA();
      
      iosPushLogger.logEvent('init-messaging', {
        iosVersion,
        isPWA,
        supportsWebPush: browserDetection.supportsIOSWebPush()
      });
      
      // iOS requires 16.4+ for web push
      if (!browserDetection.supportsIOSWebPush()) {
        if (DEBUG_MESSAGING) {
          console.log(`iOS ${iosVersion} doesn't support web push notifications`);
        }
        return null;
      }
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    if (DEBUG_MESSAGING) console.log('Service worker ready:', registration);

    // Initialize Firebase messaging
    const messaging = getMessaging(firebaseApp);
    if (DEBUG_MESSAGING) console.log('Firebase messaging initialized');

    // Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      if (DEBUG_MESSAGING) console.log('FCM token received:', currentToken.substring(0, 10) + '...');
      
      // Log token for iOS devices
      if (browserDetection.isIOS()) {
        iosPushLogger.logEvent('token-received', {
          tokenPrefix: currentToken.substring(0, 5) + '...',
          isPWA: browserDetection.isIOSPWA()
        });
      }
      
      return currentToken;
    } else {
      console.warn('No FCM token received');
      
      if (browserDetection.isIOS()) {
        iosPushLogger.logEvent('no-token-received', {
          isPWA: browserDetection.isIOSPWA(),
          permission: Notification.permission
        });
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error initializing messaging:', error);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logEvent('messaging-error', {
        error: error instanceof Error ? error.message : String(error),
        isPWA: browserDetection.isIOSPWA()
      });
    }
    
    return null;
  }
}

/**
 * Set up a listener for foreground messages
 * @param callback Function to call when a message is received
 * @returns Function to unsubscribe the listener
 */
export function setupForegroundMessageListener(
  callback: (payload: any) => void
): () => void {
  try {
    if (!firebaseApp) {
      console.error('Firebase app not initialized');
      return () => {};
    }

    if (typeof window === 'undefined') {
      return () => {};
    }

    const messaging = getMessaging(firebaseApp);
    
    // Set up the message handler
    const unsubscribe = onMessage(messaging, (payload) => {
      if (DEBUG_MESSAGING) console.log('Foreground message received:', payload);
      
      // Log for iOS devices
      if (browserDetection.isIOS()) {
        iosPushLogger.logEvent('foreground-message', {
          messageId: payload.messageId,
          isPWA: browserDetection.isIOSPWA()
        });
      }
      
      // Call the provided callback
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {};
  }
}

/**
 * Register the device for push notifications
 * @returns Promise that resolves with the FCM token or null if registration failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notifications not supported');
      return null;
    }

    // Check permission status
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Initialize messaging and get token
    const token = await initializeMessaging();
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Check if push notifications are supported in this browser
 * @returns True if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Basic support check
  const basicSupport = 'Notification' in window && 'serviceWorker' in navigator;
  
  // iOS-specific check
  if (browserDetection.isIOS()) {
    return basicSupport && browserDetection.supportsIOSWebPush();
  }
  
  return basicSupport;
}

/**
 * Get the current notification permission state
 * @returns The current permission state or null if not supported
 */
export function getNotificationPermissionState(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }
  
  return Notification.permission;
}

/**
 * Request notification permission and register for push
 * @returns Promise that resolves with the FCM token or null if permission denied
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notifications not supported');
      return null;
    }

    // Request permission if not already granted
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }
    }

    // Initialize messaging and get token
    const token = await initializeMessaging();
    return token;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}
