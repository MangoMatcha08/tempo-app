
import { getToken, onMessage } from 'firebase/messaging';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase, messaging, firestore, vapidKey } from './firebase';
import { defaultNotificationSettings } from './types';

// Request permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  await initializeFirebase();
  if (!messaging) {
    console.error('Messaging is not available in this browser or environment');
    return null;
  }
  
  try {
    console.log('Starting permission request flow');
    
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    console.log('Is mobile device:', isMobile);
    
    // Get service worker registration
    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.getRegistration();
        if (!swRegistration) {
          // Register service worker if not already registered
          console.log('Service worker not found, registering now...');
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service worker registered:', swRegistration);
        } else {
          console.log('Found existing service worker:', swRegistration);
        }
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
    } else {
      console.warn('Service workers not supported in this browser');
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Permission request result:', permission);
    
    if (permission === 'granted') {
      try {
        // Get token with explicit service worker registration
        const tokenOptions = {
          vapidKey,
          serviceWorkerRegistration: swRegistration
        };
        
        console.log('Getting FCM token with options:', tokenOptions);
        const token = await getToken(messaging, tokenOptions);
        console.log('FCM token obtained:', token ? token.substring(0, 10) + '...' : 'null');
        
        if (!token) {
          console.error('Failed to get FCM token despite permission granted');
          return null;
        }
        
        // Save token to user's document in Firestore
        const userId = localStorage.getItem('userId') || 'anonymous';
        await saveTokenToFirestore(userId, token);
        
        return token;
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in notification permission flow:', error);
    return null;
  }
};

// Save FCM token to Firestore
export const saveTokenToFirestore = async (userId: string, token: string): Promise<void> => {
  await initializeFirebase();
  if (!firestore) return;
  
  try {
    console.log(`Saving token for user ${userId}`);
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Update existing user document
      // Use dynamic property syntax to add the new token to the existing tokens
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

// Send a test notification to verify FCM setup
export const sendTestNotification = async (email: string): Promise<boolean> => {
  try {
    // In a real implementation, this would call your backend API
    // For demo purposes, we'll just simulate a successful response
    console.log(`Simulating sending test notification to: ${email}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

// Listen for foreground messages
export const setupForegroundMessageListener = (callback: (payload: any) => void): (() => void) => {
  initializeFirebase();
  if (!messaging) return () => {};
  
  try {
    console.log('Setting up foreground message listener');
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      
      // Extract user ID from the payload
      const userId = payload.data?.userId || 'anonymous';
      const currentUser = localStorage.getItem('userId') || 'anonymous';
      
      // Only process messages intended for the current user
      if (userId === 'anonymous' || userId === currentUser) {
        callback(payload);
      } else {
        console.log(`Ignoring message intended for user ${userId}, current user is ${currentUser}`);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {};
  }
};
