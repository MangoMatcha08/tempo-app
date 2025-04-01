
// Firebase Cloud Messaging configuration and utilities
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ReminderPriority } from '@/types/reminderTypes';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB9CRFtt-AaGZ-yVpPdOBaTRzmdi73MMu8',
  authDomain: 'tempowizard-ac888.firebaseapp.com',
  projectId: 'tempowizard-ac888',
  storageBucket: 'tempowizard-ac888.firebasestorage.app',
  messagingSenderId: '773638364697',
  appId: '1:773638364697:web:bb37937aefdf2985a25488',
  measurementId: 'G-WW90RJ28BH'
};

// FCM Vapid Key
const vapidKey = 'BJ9HWzAxfk1jKtkGfoKYMauaVfMatIkqw0cCEwQ1WBH7cn5evFO_saWfpvXAVy5710DTOpSUoXsKk8LWGQK7lBU';

// Initialize Firebase
let messaging = null;
let firestore = null;
let firebaseInitialized = false;

// Safely initialize Firebase only in browser environment
const initializeFirebase = async () => {
  if (firebaseInitialized) return { messaging, firestore };
  
  if (typeof window !== 'undefined') {
    try {
      const app = initializeApp(firebaseConfig);
      
      // Check if messaging is supported
      const supported = await isSupported();
      if (supported) {
        messaging = getMessaging(app);
        console.log('Firebase messaging initialized');
      } else {
        console.log('Firebase messaging not supported in this browser');
      }
      
      firestore = getFirestore(app);
      firebaseInitialized = true;
      
      return { messaging, firestore };
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return { messaging: null, firestore: null };
    }
  }
  
  return { messaging: null, firestore: null };
};

// Initialize Firebase when this module is loaded
initializeFirebase().catch(err => console.error('Failed to initialize Firebase:', err));

// User notification settings interface
export interface NotificationSettings {
  enabled: boolean;
  email: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority;
    dailySummary?: {
      enabled: boolean;
      timing: 'before' | 'after';
    };
  };
  push: {
    enabled: boolean;
    minPriority: ReminderPriority;
  };
  inApp: {
    enabled: boolean;
    minPriority: ReminderPriority;
  };
}

// Default notification settings
export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  email: {
    enabled: true,
    address: '',
    minPriority: ReminderPriority.HIGH,
    dailySummary: {
      enabled: false,
      timing: 'after'
    }
  },
  push: {
    enabled: true,
    minPriority: ReminderPriority.MEDIUM
  },
  inApp: {
    enabled: true,
    minPriority: ReminderPriority.LOW
  }
};

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
      await updateDoc(userDocRef, {
        fcmTokens: { [token]: true },
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

// Get user's notification settings
export const getUserNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  await initializeFirebase();
  if (!firestore) return defaultNotificationSettings;
  
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists() && userDoc.data().notificationSettings) {
      const settings = userDoc.data().notificationSettings as NotificationSettings;
      
      // Ensure dailySummary settings exist
      if (!settings.email.dailySummary) {
        settings.email.dailySummary = defaultNotificationSettings.email.dailySummary;
      }
      
      return settings;
    }
    
    return defaultNotificationSettings;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return defaultNotificationSettings;
  }
};

// Update user's notification settings
export const updateUserNotificationSettings = async (
  userId: string, 
  settings: Partial<NotificationSettings>
): Promise<void> => {
  await initializeFirebase();
  if (!firestore) return;
  
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const currentSettings = userDoc.data().notificationSettings || defaultNotificationSettings;
      const updatedSettings = { ...currentSettings, ...settings };
      
      await updateDoc(userDocRef, {
        notificationSettings: updatedSettings,
        updatedAt: new Date()
      });
    } else {
      await setDoc(userDocRef, {
        notificationSettings: { ...defaultNotificationSettings, ...settings },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating notification settings:', error);
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

// Check if notification should be sent based on priority and user settings
export const shouldSendNotification = (
  priority: ReminderPriority,
  settings: NotificationSettings,
  notificationType: 'email' | 'push' | 'inApp'
): boolean => {
  if (!settings.enabled) return false;
  
  const typeSettings = settings[notificationType];
  if (!typeSettings.enabled) return false;
  
  // Convert priority to numeric value for comparison
  const priorityValues = {
    [ReminderPriority.LOW]: 1,
    [ReminderPriority.MEDIUM]: 2,
    [ReminderPriority.HIGH]: 3
  };
  
  const reminderPriorityValue = priorityValues[priority];
  const minPriorityValue = priorityValues[typeSettings.minPriority];
  
  return reminderPriorityValue >= minPriorityValue;
};

export default {
  requestNotificationPermission,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  sendTestNotification,
  setupForegroundMessageListener,
  shouldSendNotification
};
