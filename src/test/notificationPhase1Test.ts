
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockNotificationRecord } from './notificationTestUtils';
import * as messagingService from '../services/notifications/core/messaging';
import { mockFirebaseMessaging } from './notificationTestUtils';
import { setupForegroundMessageListener, firebaseInitPromise } from '@/services/notifications/core/messaging';

describe('Phase 1: Module and Declaration Fixes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should export saveTokenToFirestore from messagingService', () => {
    expect(messagingService.saveTokenToFirestore).toBeDefined();
  });

  it('should re-export saveTokenToFirestore', () => {
    expect(messagingService.messagingServiceSaveTokenToFirestore).toBeDefined();
    expect(messagingService.default.saveTokenToFirestore).toBeDefined();
  });

  it('should handle Firebase initialization properly', async () => {
    expect(firebaseInitPromise).toBeDefined();
  });

  it('should create a valid notification record', () => {
    const record = createMockNotificationRecord();
    expect(record).toHaveProperty('id');
    expect(record).toHaveProperty('title');
    expect(record).toHaveProperty('body');
  });

  // Test the import chain to make sure everything is properly exported
  it('should have proper export chain', () => {
    const messagingServiceExports = Object.keys(messagingService);
    expect(messagingServiceExports).toContain('messagingServiceSaveTokenToFirestore');
    expect(messagingServiceExports).toContain('saveTokenToFirestore');
    expect(messagingServiceExports).toContain('setupForegroundMessageListener');
  });
});
