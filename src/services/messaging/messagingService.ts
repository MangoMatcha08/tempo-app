
import { initializeFirebase } from '../notifications/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { FirebaseMessagingPayload } from '@/types/notifications/serviceWorkerTypes';

// Save FCM token to Firestore
export const saveTokenToFirestore = async (userId: string, token: string): Promise<void> => {
  try {
    const firestore = getFirestore();
    const tokenRef = doc(firestore, 'users', userId, 'fcmTokens', token);
    
    await setDoc(tokenRef, {
      token,
      device: navigator.userAgent,
      createdAt: new Date(),
      lastUsed: new Date()
    });
    
    console.log('FCM Token saved to Firestore');
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Initialize Firebase first
    await initializeFirebase();
    
    // Check permission status first
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notifications not supported in this environment');
      return null;
    }
    
    let permission = Notification.permission;
    
    // If permission is not granted, request it
    if (permission !== 'granted') {
      permission = await window.Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }
    
    // Get messaging instance
    const messaging = getMessaging();
    
    // Get registration token
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    
    if (token) {
      console.log('FCM token:', token);
      
      // Save token to Firestore
      const userId = localStorage.getItem('userId');
      if (userId) {
        await saveTokenToFirestore(userId, token);
      }
      
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Set up foreground message listener
export const setupForegroundMessageListener = (
  callback: (payload: FirebaseMessagingPayload) => void
): (() => void) => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notifications not supported in this environment');
      return () => {};
    }
    
    const messaging = getMessaging();
    
    // Listen for messages in the foreground
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload as FirebaseMessagingPayload);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {};
  }
};

// Send a test push notification
export const sendTestNotification = async (options: { 
  type: string;
  email?: string;
  includeDeviceInfo?: boolean;
}): Promise<any> => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('User ID not available');
    }
    
    // Import the function dynamically to prevent circular dependencies
    const { sendTestNotificationFn } = await import('@/lib/firebase/functions');
    
    // Call the cloud function to send the test notification
    const result = await sendTestNotificationFn({
      ...options,
      userId
    });
    
    return result;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};
