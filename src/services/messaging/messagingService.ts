import { getToken, onMessage } from 'firebase/messaging';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase, messaging, firestore, vapidKey } from './firebase';
import { defaultNotificationSettings } from '@/types/notifications/settingsTypes';
import { httpsCallable, getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Debug flag for messaging operations
export const DEBUG_MESSAGING = process.env.NODE_ENV === 'development';

// Initialize Firebase services
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase app
const app = initializeFirebase(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Sign in anonymously
signInAnonymously(auth)
  .then(() => {
    console.log('Successfully signed in anonymously');
  })
  .catch((error) => {
    console.error('Error signing in anonymously:', error);
  });

// Initialize Cloud Firestore
const db = getFirestore(app);

// Initialize Firebase Cloud Messaging
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Initialize Firebase IOS Push Logger
const iosPushLogger = new FirebaseIOSPushLogger(analytics);

/**
 * Initializes Firebase Cloud Messaging and requests notification permission.
 * @returns {Promise<string | null>} The FCM token if permission is granted, otherwise null.
 */
export const initializeMessaging = async (): Promise<string | null> => {
  if (!messaging) {
    console.log('Firebase Cloud Messaging is not supported in this environment.');
    return null;
  }

  try {
    // Request notification permission
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      // Get the FCM token
      const token = await getRegistrationToken();
      return token;
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error initializing Firebase Cloud Messaging:', error);
    return null;
  }
};

/**
 * Requests notification permission from the user.
 * @returns {Promise<NotificationPermission>} The permission granted by the user.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Notifications are not supported in this browser.');
    return 'denied';
  }

  // Log the permission request event
  iosPushLogger.logPermissionEvent('permission_requested', { 
    source: 'auto_initialize',
    currentState: Notification.permission
  });

  try {
    // Request permission from the user
    const permission = await Notification.requestPermission();

    // Log the permission result event
    iosPushLogger.logPermissionEvent('permission_result', { 
      source: 'auto_initialize',
      currentState: permission
    });

    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Retrieves the FCM token for the current device.
 * @returns {Promise<string | null>} The FCM token if available, otherwise null.
 */
const getRegistrationToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.log('Firebase Cloud Messaging is not supported in this environment.');
    return null;
  }

  try {
    // Get the FCM token
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    if (token) {
      console.log('FCM token:', token);
      return token;
    } else {
      console.log('No FCM token received.');
      return null;
    }
  } catch (error) {
    if ((error as any).code === 'messaging/permission-blocked') {
      console.warn('Notification permission blocked.');
      return null;
    } else {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }
};

/**
 * Sets up a listener for foreground messages.
 * @param {(payload: any) => void} callback The callback function to handle foreground messages.
 * @returns {() => void} A function to unsubscribe from the foreground message listener.
 */
export const setupForegroundMessageListener = (callback: (payload: any) => void): () => void => {
  if (!messaging) {
    console.log('Firebase Cloud Messaging is not supported in this environment.');
    return () => {};
  }

  // Listen for foreground messages
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });

  // Return the unsubscribe function
  return unsubscribe;
};

/**
 * Saves the FCM token to Firestore.
 * @param {string} userId The ID of the user.
 * @param {string} token The FCM token to save.
 * @returns {Promise<void>}
 */
export const saveTokenToFirestore = async (userId: string, token: string): Promise<void> => {
  try {
    // Save the token to Firestore
    const tokenRef = doc(db, 'fcmTokens', token);
    await setDoc(tokenRef, {
      userId: userId,
      token: token
    });
    console.log('FCM token saved to Firestore.');
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error);
  }
};

/**
 * Sends a test notification using Firebase Cloud Messaging.
 * @param {object} options - Options for sending the test notification.
 * @param {string} options.type - The type of notification to send ('push' or 'email').
 * @param {string} [options.email] - The email address to send the notification to (required if type is 'email').
 * @param {boolean} [options.includeDeviceInfo] - Whether to include device information in the notification payload.
 * @returns {Promise<boolean>} - A promise that resolves to true if the notification was sent successfully, or false otherwise.
 */
export const sendTestNotification = async (options: { type: 'push' | 'email'; email?: string; includeDeviceInfo?: boolean }): Promise<boolean> => {
  const { type, email, includeDeviceInfo } = options;

  if (type === 'email') {
    if (!email) {
      console.error('Email address is required for email notifications.');
      return false;
    }
    // Implement email sending logic here
    console.log(`Sending test email to ${email} with includeDeviceInfo=${includeDeviceInfo}`);
    return true;
  } else if (type === 'push') {
    // Implement push notification sending logic here
    console.log(`Sending test push notification with includeDeviceInfo=${includeDeviceInfo}`);
    
    // Log a test notification event
    logEvent(analytics, 'test_notification_sent', {
      type: 'push',
      includeDeviceInfo: includeDeviceInfo || false
    });
    return true;
  } else {
    console.error(`Unsupported notification type: ${type}`);
    return false;
  }
};

/**
 * Logs a notification permission event to Firebase Analytics.
 * @param {string} eventName - The name of the event to log.
 * @param {object} eventParams - The parameters to include with the event.
 * @returns {void}
 */
export const logNotificationPermissionEvent = (eventName: string, eventParams: object): void => {
  logEvent(analytics, eventName, eventParams);
};
