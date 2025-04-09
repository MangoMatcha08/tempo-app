
import { 
  initializeMessaging, 
  requestNotificationPermission, 
  setupForegroundMessageListener,
  saveTokenToFirestore,
  sendTestNotification
} from './messaging/messagingService';

// Ensure firebase is initialized once
import { ensureFirebaseInitialized } from '@/lib/firebase';
let firebaseInitialized = false;

// Promise to track firebase initialization
export const firebaseInitPromise = new Promise<void>(resolve => {
  if (firebaseInitialized) {
    resolve();
  } else {
    firebaseInitialized = ensureFirebaseInitialized();
    resolve();
  }
});

// Re-export the functions from messagingService
export {
  initializeMessaging,
  requestNotificationPermission,
  setupForegroundMessageListener,
  saveTokenToFirestore,
  sendTestNotification
};

// Additional utility functions can be added here
