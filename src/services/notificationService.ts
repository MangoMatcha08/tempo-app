
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
import { 
  sendTestNotification as sendTestNotificationFn,
  callFunction 
} from '@/lib/firebase/functions';

// Import and re-export the type correctly
import type { NotificationSettings } from './notifications/types';
export type { NotificationSettings };

// Initialize Firebase when this module is loaded, but do it async to not block
const firebaseInitPromise = initializeFirebase().catch(err => {
  console.error('Failed to initialize Firebase:', err);
  return false;
});

// Action handlers for notification interactions
export const handleNotificationAction = async (action: 'complete' | 'snooze', reminderId: string, snoozeMinutes?: number) => {
  try {
    const result = await callFunction('handleNotificationAction', {
      action,
      reminderId,
      timestamp: Date.now(),
      snoozeMinutes: snoozeMinutes || 30 // Default snooze time
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error handling notification action '${action}':`, error);
    return { success: false, error };
  }
};

// Specialized action handlers
export const completeReminderFromNotification = async (reminderId: string) => {
  return handleNotificationAction('complete', reminderId);
};

export const snoozeReminderFromNotification = async (reminderId: string, snoozeMinutes: number = 30) => {
  return handleNotificationAction('snooze', reminderId, snoozeMinutes);
};

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

export default {
  requestNotificationPermission,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  sendTestNotification,
  setupForegroundMessageListener,
  shouldSendNotification,
  sendTestNotificationFn,
  completeReminderFromNotification,
  snoozeReminderFromNotification,
  handleNotificationAction
};
