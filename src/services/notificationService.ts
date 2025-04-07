
// Re-export all notification service functionality
import { initializeFirebase } from './notifications/firebase';
import { 
  defaultNotificationSettings 
} from './notifications/types';
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
} from './notifications/messaging';

// Import the functions
import { sendTestNotification as sendTestNotificationFn } from '@/lib/firebase/functions';

// Import and re-export the type correctly
import type { NotificationSettings } from './notifications/types';
export type { NotificationSettings };

// Initialize Firebase when this module is loaded
initializeFirebase().catch(err => console.error('Failed to initialize Firebase:', err));

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
  sendTestNotificationFn
};

export default {
  requestNotificationPermission,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  sendTestNotification,
  setupForegroundMessageListener,
  shouldSendNotification,
  sendTestNotificationFn
};
