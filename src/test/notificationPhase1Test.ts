
import { vi } from 'vitest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockNotificationRecord } from './notificationTestUtils';
import * as notificationService from '../services/notificationService';
import * as messagingService from '../services/messaging/messagingService';

describe('Phase 1: Module and Declaration Fixes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should export saveTokenToFirestore from messagingService', () => {
    expect(messagingService.saveTokenToFirestore).toBeDefined();
  });

  it('should re-export saveTokenToFirestore in notificationService', () => {
    expect(notificationService.messagingServiceSaveTokenToFirestore).toBeDefined();
    expect(notificationService.default.saveTokenToFirestore).toBeDefined();
  });

  it('should handle Firebase initialization properly', async () => {
    const initPromise = notificationService.firebaseInitPromise;
    expect(initPromise).toBeDefined();
  });

  it('should create a valid notification record', () => {
    const record = createMockNotificationRecord();
    expect(record).toHaveProperty('id');
    expect(record).toHaveProperty('title');
    expect(record).toHaveProperty('body');
  });

  // Test the import chain to make sure everything is properly exported
  it('should have proper export chain', () => {
    const notificationServiceExports = Object.keys(notificationService);
    expect(notificationServiceExports).toContain('messagingServiceSaveTokenToFirestore');
    expect(notificationServiceExports).toContain('requestNotificationPermission');
    expect(notificationServiceExports).toContain('setupForegroundMessageListener');
  });
});
