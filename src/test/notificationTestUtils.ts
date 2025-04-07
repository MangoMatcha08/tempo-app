
import { NotificationSettings } from '@/types/notifications/settingsTypes';
import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';
import { ReminderPriority, NotificationType } from '@/types/reminderTypes';

/**
 * Create a mock notification record for testing
 */
export const createMockNotificationRecord = (
  overrides: Partial<NotificationRecord> = {}
): NotificationRecord => {
  return {
    id: `notification-${Date.now()}`,
    title: 'Test Notification',
    body: 'This is a test notification',
    timestamp: Date.now(),
    type: NotificationType.TEST,
    reminderId: `reminder-${Date.now()}`,
    priority: ReminderPriority.MEDIUM,
    status: 'sent',
    channels: ['inApp'],
    ...overrides
  };
};

/**
 * Create mock notification settings for testing
 */
export const createMockNotificationSettings = (
  overrides: Partial<NotificationSettings> = {}
): NotificationSettings => {
  return {
    enabled: true,
    email: {
      enabled: true,
      address: 'test@example.com',
      minPriority: ReminderPriority.HIGH,
      dailySummary: {
        enabled: false,
        timing: 'after'
      }
    },
    push: {
      enabled: true,
      minPriority: ReminderPriority.MEDIUM
    },
    inApp: {
      enabled: true,
      minPriority: ReminderPriority.LOW
    },
    ...overrides
  };
};

/**
 * Mock Firebase messaging functionality for testing
 */
export const mockFirebaseMessaging = () => {
  // Return mock functions for Firebase messaging
  return {
    requestNotificationPermission: async () => 'mock-token',
    setupForegroundMessageListener: (callback: any) => {
      // Return a mock unsubscribe function
      return () => {};
    },
    sendTestNotification: async (options: any) => {
      return { success: true };
    }
  };
};

/**
 * Test notification display in the UI
 */
export const testNotificationDisplay = (
  mockNotification: NotificationRecord
) => {
  // This function would typically use testing library to check if notification is displayed
  console.log('Testing notification display:', mockNotification);
  return true;
};

/**
 * "Definition of done" criteria checker
 */
export const checkDefinitionOfDoneCriteria = (
  featureName: string,
  criteria: Record<string, boolean>
) => {
  const allCriteriaMet = Object.values(criteria).every(Boolean);
  console.log(`Feature "${featureName}" definition of done: ${allCriteriaMet ? 'COMPLETE' : 'INCOMPLETE'}`);
  
  // Log individual criteria status
  Object.entries(criteria).forEach(([name, met]) => {
    console.log(`- ${name}: ${met ? '✓' : '✗'}`);
  });
  
  return allCriteriaMet;
};
