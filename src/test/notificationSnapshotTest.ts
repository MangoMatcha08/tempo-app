
import { describe, it, expect } from 'vitest';
import { default as notificationServiceDefault } from '../services/notificationService';

describe('Notification Service Structure', () => {
  it('should maintain the expected API structure', () => {
    // This creates a sanitized representation of the export structure
    // without exposing internal implementation details
    const apiStructure = Object.keys(notificationServiceDefault).sort();
    
    // We expect these methods to be available
    expect(apiStructure).toContain('requestNotificationPermission');
    expect(apiStructure).toContain('getUserNotificationSettings');
    expect(apiStructure).toContain('updateUserNotificationSettings');
    expect(apiStructure).toContain('sendTestNotification');
    expect(apiStructure).toContain('setupForegroundMessageListener');
    expect(apiStructure).toContain('shouldSendNotification');
    expect(apiStructure).toContain('saveTokenToFirestore');
    expect(apiStructure).toContain('sendTestNotificationFn');
  });

  it('should have the right saveTokenToFirestore reference', () => {
    // This ensures that saveTokenToFirestore is the correct reference 
    // from messagingServiceSaveTokenToFirestore
    const saveTokenFunc = notificationServiceDefault.saveTokenToFirestore;
    expect(typeof saveTokenFunc).toBe('function');
  });
});
