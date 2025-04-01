
import { getToken, onMessage } from 'firebase/messaging';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase, messaging, firestore, vapidKey } from './firebase';
import { defaultNotificationSettings } from './types';

// Request permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  await initializeFirebase();
  if (!messaging) return null;
  
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get token
      const token = await getToken(messaging, { vapidKey });
      
      // Save token to user's document in Firestore
      const userId = localStorage.getItem('userId') || 'anonymous';
      await saveTokenToFirestore(userId, token);
      
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Save FCM token to Firestore
export const saveTokenToFirestore = async (userId: string, token: string): Promise<void> => {
  await initializeFirebase();
  if (!firestore) return;
  
  try {
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
    } else {
      // Create new user document
      await setDoc(userDocRef, {
        fcmTokens: { [token]: true },
        notificationSettings: defaultNotificationSettings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
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
  
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('Received foreground message:', payload);
    callback(payload);
  });
  
  return unsubscribe;
};
