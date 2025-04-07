
// Re-export notification service functionality
import { initializeFirebase } from './notifications/firebase';
import { defaultNotificationSettings } from '@/types/notifications/settingsTypes';
import { 
  getUserNotificationSettings, 
  updateUserNotificationSettings, 
  shouldSendNotification 
} from './notifications/settings';
import {
  requestNotificationPermission,
  saveTokenToFirestore,
  sendTestNotification,
  setupForegroundMessageListener
} from './messaging/messagingService';

// Import the functions
import { sendTestNotification as sendTestNotificationFn } from '@/lib/firebase/functions';

// Import and re-export the type correctly
import type { NotificationSettings } from '@/types/notifications/settingsTypes';
export type { NotificationSettings };

// Initialize Firebase when this module is loaded, but do it async to not block
const firebaseInitPromise = initializeFirebase().catch(err => {
  console.error('Failed to initialize Firebase:', err);
  return false;
});

// Export all functionality
export {
  defaultNotificationSettings,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  requestNotificationPermission,
  saveTokenToFirestore,
  sendTestNotification,
  setupForegroundMessageListener,
  shouldSendNotification,
  sendTestNotificationFn,
  firebaseInitPromise
};

// Export default object with consistent naming
export default {
  requestNotificationPermission,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  sendTestNotification,
  setupForegroundMessageListener,
  shouldSendNotification,
  sendTestNotificationFn
};
