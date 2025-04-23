
// Re-export notification service functionality
import { 
  initializeFirebase,
  requestNotificationPermission,
  setupForegroundMessageListener,
  saveTokenToFirestore as messagingServiceSaveTokenToFirestore,
  firebaseInitPromise
} from './notifications';

import { 
  NotificationSettings, 
  defaultNotificationSettings 
} from '@/types/notifications/settingsTypes';

import { 
  getUserNotificationSettings, 
  updateUserNotificationSettings, 
  shouldSendNotification 
} from './notifications/settings';

// Import the functions
import { sendTestNotification as sendTestNotificationFn } from '@/lib/firebase/functions';

// Re-export the type
export type { NotificationSettings };

// Export all functionality
export {
  defaultNotificationSettings,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  requestNotificationPermission,
  messagingServiceSaveTokenToFirestore,
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
  sendTestNotification: sendTestNotificationFn,
  setupForegroundMessageListener,
  shouldSendNotification,
  sendTestNotificationFn,
  saveTokenToFirestore: messagingServiceSaveTokenToFirestore
};
