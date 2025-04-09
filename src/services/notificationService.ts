
import { 
  initializeMessaging, 
  requestNotificationPermission, 
  setupForegroundMessageListener,
  saveTokenToFirestore,
  sendTestNotification as sendTestNotificationService
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
  saveTokenToFirestore
};

// Export test notification with type correction
export const sendTestNotification = async (options: { 
  type: 'push' | 'email'; 
  email?: string; 
  includeDeviceInfo?: boolean 
}): Promise<boolean> => {
  return sendTestNotificationService(options);
};

// Add missing functions required by NotificationSettingsContext
export const getUserNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  // Default settings that would normally be fetched from Firestore
  return {
    enabled: true,
    push: {
      enabled: true,
      minPriority: "low" // Compatible with NotificationSettings type
    },
    email: {
      enabled: false,
      address: '',
      minPriority: "medium", // Compatible with NotificationSettings type
      dailySummary: {
        enabled: false,
        timing: 'before'
      }
    },
    inApp: {
      enabled: true,
      minPriority: "low" // Compatible with NotificationSettings type
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
    grouping: 'none',
    sms: false
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
