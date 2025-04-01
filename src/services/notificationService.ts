
// Re-export all notification service functionality
import { initializeFirebase } from './notifications/firebase';
import { 
  NotificationSettings, 
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

// Initialize Firebase when this module is loaded
initializeFirebase().catch(err => console.error('Failed to initialize Firebase:', err));

// Export all functionality
export {
  NotificationSettings,
  defaultNotificationSettings,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  requestNotificationPermission,
  saveTokenToFirestore,
  sendTestNotification,
  setupForegroundMessageListener,
  shouldSendNotification
};

export default {
  requestNotificationPermission,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  sendTestNotification,
  setupForegroundMessageListener,
  shouldSendNotification
};
