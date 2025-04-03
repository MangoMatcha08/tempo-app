import { getToken, onMessage } from 'firebase/messaging';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase, messaging, firestore, vapidKey, isIOSDevice, isAndroidDevice, isPWAMode } from './firebase';
import { defaultNotificationSettings } from './types';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("MessagingService");

// Request permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  await initializeFirebase();
  if (!messaging) {
    debugLog('Messaging is not available in this browser or environment');
    return null;
  }
  
  try {
    debugLog('Starting permission request flow');
    
    // Check if we're on a mobile device
    const isMobile = isIOSDevice() || isAndroidDevice();
    const isPWA = isPWAMode();
    debugLog('Is mobile device:', isMobile, 'Is PWA:', isPWA, 'Is iOS:', isIOSDevice(), 'Is Android:', isAndroidDevice());
    
    // Get service worker registration
    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (!swRegistration) {
          // Register service worker if not already registered
          debugLog('Service worker not found, registering now...');
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          debugLog('Service worker registered:', swRegistration);
        } else {
          debugLog('Found existing service worker:', swRegistration);
        }
      } catch (err) {
        console.error('Service worker registration failed:', err);
        debugLog(`Service worker registration failed: ${err}`);
      }
    } else {
      debugLog('Service workers not supported in this browser');
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    debugLog('Permission request result:', permission);
    
    if (permission === 'granted') {
      try {
        // Get token with explicit service worker registration
        const tokenOptions = {
          vapidKey,
          serviceWorkerRegistration: swRegistration
        };
        
        debugLog('Getting FCM token with options:', tokenOptions);
        const token = await getToken(messaging, tokenOptions);
        debugLog('FCM token obtained:', token ? token.substring(0, 10) + '...' : 'null');
        
        if (!token) {
          debugLog('Failed to get FCM token despite permission granted');
          return null;
        }
        
        // Save token to user's document in Firestore
        const userId = localStorage.getItem('userId') || 'anonymous';
        await saveTokenToFirestore(userId, token);
        
        return token;
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
        debugLog(`Error getting FCM token: ${tokenError}`);
        
        // For iOS PWA, we might need to use a different approach
        if (isIOSDevice() && isPWAMode()) {
          debugLog('iOS PWA detected, using alternative notification approach');
          
          // For iOS PWA, we'll use the native Notification API directly
          // This doesn't give us a token, but we can still show notifications
          // when the app is open
          return 'ios-pwa-fallback';
        }
        
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in notification permission flow:', error);
    debugLog(`Error in notification permission flow: ${error}`);
    return null;
  }
};

// Save FCM token to Firestore
export const saveTokenToFirestore = async (userId: string, token: string): Promise<void> => {
  await initializeFirebase();
  if (!firestore) return;
  
  try {
    debugLog(`Saving token for user ${userId}`);
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
      debugLog('Updated existing user document with token');
    } else {
      // Create new user document
      await setDoc(userDocRef, {
        fcmTokens: { [token]: true },
        notificationSettings: defaultNotificationSettings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      debugLog('Created new user document with token');
    }
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
    debugLog(`Error saving token to Firestore: ${error}`);
  }
};

// Send a test notification to verify FCM setup
export const sendTestNotification = async (email: string): Promise<boolean> => {
  try {
    debugLog(`Sending test notification to: ${email}`);
    
    // Check if we have permission
    if (Notification.permission !== 'granted') {
      debugLog('Notification permission not granted');
      return false;
    }
    
    // For PWA, we can use the Notification API directly
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        // Create notification content
        const notificationTitle = 'Tempo Test Notification';
        const notificationOptions = {
          body: 'This is a test notification from Tempo',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `tempo-test-${Date.now()}`,
          data: {
            url: '/dashboard',
            timestamp: new Date().getTime()
          }
        };
        
        // Show the notification
        await registration.showNotification(notificationTitle, notificationOptions);
        debugLog('Test notification sent successfully');
        return true;
      } else {
        debugLog('No service worker registration found');
      }
    }
    
    // Fallback to FCM for cross-device notifications
    try {
      if (messaging) {
        const currentToken = await getToken(messaging);
        
        if (currentToken) {
          // In a real app, you would send this to your server
          // For now, we'll just log it
          debugLog('FCM token available, would send to server:', currentToken.substring(0, 10) + '...');
          
          // Simulate sending to FCM
          debugLog('Simulating FCM notification send');
          return true;
        } else {
          debugLog('No FCM token available');
        }
      }
    } catch (fcmError) {
      console.error('Error with FCM:', fcmError);
      debugLog(`Error with FCM: ${fcmError}`);
    }
    
    return false;
  } catch (error) {
    console.error('Error sending test notification:', error);
    debugLog(`Error sending test notification: ${error}`);
    return false;
  }
};

// Listen for foreground messages
export const setupForegroundMessageListener = (callback: (payload: any) => void): (() => void) => {
  initializeFirebase();
  if (!messaging) return () => {};
  
  try {
    debugLog('Setting up foreground message listener');
    const unsubscribe = onMessage(messaging, (payload) => {
      debugLog('Received foreground message:', payload);
      
      // Extract user ID from the payload
      const userId = payload.data?.userId || 'anonymous';
      const currentUser = localStorage.getItem('userId') || 'anonymous';
      
      // Only process messages intended for the current user
      if (userId === 'anonymous' || userId === currentUser) {
        callback(payload);
      } else {
        debugLog(`Ignoring message intended for user ${userId}, current user is ${currentUser}`);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    debugLog(`Error setting up message listener: ${error}`);
    return () => {};
  }
};

// Schedule a notification for a specific time
export const scheduleReminder = async (
  reminderId: string, 
  title: string, 
  body: string, 
  scheduledTime: Date
): Promise<boolean> => {
  try {
    debugLog(`Scheduling reminder notification for ${scheduledTime.toLocaleString()}`);
    
    const now = new Date();
    const timeDiff = scheduledTime.getTime() - now.getTime();
    
    // If the scheduled time is in the past, don't schedule
    if (timeDiff <= 0) {
      debugLog('Scheduled time is in the past, not scheduling notification');
      return false;
    }
    
    // Schedule the notification
    setTimeout(async () => {
      try {
        // Check if we have permission
        if (Notification.permission !== 'granted') {
          debugLog('Notification permission not granted');
          return;
        }
        
        // For PWA, we can use the Notification API directly
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (registration) {
            // Create notification content
            const notificationOptions = {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `tempo-reminder-${reminderId}`,
              data: {
                reminderId,
                url: '/dashboard',
                timestamp: new Date().getTime()
              },
              actions: [
                {
                  action: 'view',
                  title: 'View'
                },
                {
                  action: 'complete',
                  title: 'Mark Complete'
                }
              ]
            };
            
            // Show the notification
            await registration.showNotification(title, notificationOptions);
            debugLog('Scheduled notification sent successfully');
          } else {
            debugLog('No service worker registration found');
          }
        }
      } catch (error) {
        console.error('Error sending scheduled notification:', error);
        debugLog(`Error sending scheduled notification: ${error}`);
      }
    }, timeDiff);
    
    debugLog('Notification scheduled successfully');
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    debugLog(`Error scheduling notification: ${error}`);
    return false;
  }
};
