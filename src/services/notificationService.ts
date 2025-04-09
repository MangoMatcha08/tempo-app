
import { 
  initializeMessaging, 
  requestNotificationPermission, 
  setupForegroundMessageListener,
  saveTokenToFirestore,
  sendTestNotification
} from './messaging/messagingService';

import { NotificationSettings } from '@/types/notifications/settingsTypes';

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

// Add missing functions required by NotificationSettingsContext
export const getUserNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  // Default settings that would normally be fetched from Firestore
  return {
    enabled: true,
    channels: {
      push: true,
      email: false,
      sms: false,
      inApp: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    categories: {
      reminders: true,
      system: true,
      marketing: false
    },
    frequency: 'immediate',
    grouping: 'none'
  };
};

export const updateUserNotificationSettings = async (
  userId: string, 
  settings: NotificationSettings
): Promise<void> => {
  // This would normally save settings to Firestore
  console.log(`Updating notification settings for user ${userId}:`, settings);
  return Promise.resolve();
};

// Additional utility functions can be added here
