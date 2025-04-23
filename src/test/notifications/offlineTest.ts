
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { initializeFirebase } from '@/services/notifications/core/initialization';
import { saveTokenToFirestore } from '@/services/notifications/storage/token';
import { requestNotificationPermission } from '@/services/notifications/core/messaging';

describe('Offline Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Functionality in Offline Mode', () => {
    beforeEach(() => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false
      });
    });

    test('initialization handles offline gracefully', async () => {
      const result = await initializeFirebase();
      expect(result.messaging).toBeNull();
      expect(result.firestore).toBeNull();
    });

    test('token storage handles offline state', async () => {
      const result = await saveTokenToFirestore('mock-token');
      expect(result).toBe(false);
    });

    test('permission requests work offline', async () => {
      const permission = await requestNotificationPermission();
      expect(permission).toBeNull();
    });
  });

  describe('Recovery from Offline', () => {
    test('recovers when connection is restored', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false
      });

      const offlineResult = await initializeFirebase();
      expect(offlineResult.messaging).toBeNull();

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true
      });

      // Dispatch online event
      window.dispatchEvent(new Event('online'));

      const onlineResult = await initializeFirebase();
      expect(onlineResult.messaging).toBeDefined();
    });
  });
});
