
import { NotificationSettings } from '@/types/notifications/settingsTypes';
import { NotificationRecord, NotificationDeliveryStatus } from '@/types/notifications/notificationHistoryTypes';
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
    status: NotificationDeliveryStatus.SENT,
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

/**
 * Test offline notification handling
 */
export const testOfflineNotificationHandling = async (
  notificationAction: () => Promise<any>,
  isOnline: boolean = false
) => {
  // Save original online status
  const originalOnlineStatus = navigator.onLine;
  
  try {
    // Mock the online status
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: isOnline
    });
    
    // Dispatch the corresponding event
    window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
    
    // Execute the notification action
    const result = await notificationAction();
    
    // Return test result
    return {
      success: true,
      result,
      wasOnline: isOnline
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      wasOnline: isOnline
    };
  } finally {
    // Restore original online status
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnlineStatus
    });
    
    // Dispatch the corresponding event
    window.dispatchEvent(new Event(originalOnlineStatus ? 'online' : 'offline'));
  }
};

/**
 * Simulate service worker events for testing
 */
export const simulateServiceWorkerEvent = (eventType: 'sync' | 'push' | 'notificationclick', payload?: any) => {
  // Check if we have a service worker controller
  if (!navigator.serviceWorker?.controller) {
    console.warn('No service worker controller available for event simulation');
    return false;
  }
  
  // Create event specific payload
  let eventPayload;
  
  switch (eventType) {
    case 'sync':
      eventPayload = { type: 'SYNC_EVENT', tag: payload?.tag || 'test-sync' };
      break;
    case 'push':
      eventPayload = { 
        type: 'PUSH_EVENT', 
        notification: payload?.notification || { title: 'Test Push', body: 'Test message' },
        data: payload?.data || {} 
      };
      break;
    case 'notificationclick':
      eventPayload = { 
        type: 'NOTIFICATION_CLICKED', 
        payload: {
          reminderId: payload?.reminderId || 'test-reminder',
          action: payload?.action || 'view',
          notification: payload?.notification || {
            id: 'test-notification',
            title: 'Test Notification',
            body: 'Test notification body'
          }
        }
      };
      break;
    default:
      console.error(`Unknown event type: ${eventType}`);
      return false;
  }
  
  // Post message to service worker
  try {
    navigator.serviceWorker.controller.postMessage(eventPayload);
    return true;
  } catch (error) {
    console.error(`Error simulating ${eventType} event:`, error);
    return false;
  }
};

/**
 * Test service worker installation and activation
 */
export const testServiceWorkerLifecycle = async () => {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, error: 'Service Workers not supported in this browser' };
  }
  
  try {
    // Attempt to register the service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    
    // Wait for the service worker to be installed and activated
    if (registration.installing) {
      // Wait for the installing service worker to change state
      await new Promise<void>((resolve) => {
        registration.installing?.addEventListener('statechange', function listener() {
          if (registration.active) {
            registration.installing?.removeEventListener('statechange', listener);
            resolve();
          }
        });
      });
    }
    
    return {
      supported: true,
      registered: true,
      active: !!registration.active,
      scope: registration.scope
    };
  } catch (error) {
    return {
      supported: true,
      registered: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
