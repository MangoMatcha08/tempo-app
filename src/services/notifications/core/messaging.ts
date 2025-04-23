
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { messaging, vapidKey } from './initialization';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { saveTokenToFirestore } from '../storage/token';
import { FirebaseMessagingPayload } from '@/types/notifications/serviceWorkerTypes';

interface ExtendedGetTokenOptions {
  vapidKey?: string;
  serviceWorkerRegistration?: ServiceWorkerRegistration;
  forceRefresh?: boolean;
}

export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Messaging not initialized, cannot get FCM token');
    return null;
  }
  
  try {
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('token-request-start');
      
      const registration = await navigator.serviceWorker.ready;
      
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
        forceRefresh: true
      } as ExtendedGetTokenOptions);
      
      if (currentToken) {
        iosPushLogger.logPushEvent('token-received', { 
          tokenPrefix: currentToken.substring(0, 5) + '...'
        });
        return currentToken;
      }
      
      iosPushLogger.logPushEvent('token-empty');
      return null;
    }
    
    const currentToken = await getToken(messaging, { vapidKey });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken.substring(0, 5) + '...');
      return currentToken;
    }
    
    console.log('No registration token available');
    return null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error getting FCM token:', errorMsg);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPushEvent('token-error', { error: errorMsg });
    }
    
    return null;
  }
};

export const setupForegroundMessageListener = (
  callback: (payload: FirebaseMessagingPayload) => void
): (() => void) => {
  if (!messaging) {
    console.warn('Messaging not initialized, cannot setup foreground listener');
    return () => {};
  }

  try {
    const unsubscribe = onMessage(messaging, (payload: any) => {
      console.log('Received foreground message:', payload);
      callback(payload);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return () => {};
  }
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return null;
  }
  
  try {
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('request-start', {
        currentPermission: Notification.permission
      });
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      if (browserDetection.isIOS()) {
        iosPushLogger.logPermissionEvent('granted');
      }
      
      const token = await getFCMToken();
      if (token) {
        await saveTokenToFirestore(token);
      }
      return token;
    }
    
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
