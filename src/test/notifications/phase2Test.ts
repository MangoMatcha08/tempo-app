
import { mockFirebaseMessaging } from '../notificationTestUtils';
import { 
  initializeFirebase, 
  messaging, 
  firestore 
} from '@/services/notifications/core/initialization';
import { 
  requestNotificationPermission,
  getFCMToken,
  setupForegroundMessageListener
} from '@/services/notifications/core/messaging';
import { saveTokenToFirestore } from '@/services/notifications/storage/token';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

describe('Notification System Phase 2', () => {
  const mockToken = 'mock-fcm-token-123';
  const mockUserId = 'test-user-123';
  
  // Mock Firebase Messaging
  const mockedMessaging = mockFirebaseMessaging();
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock window and navigator for offline testing
    const windowSpy = vi.spyOn(window, 'window', 'get');
    windowSpy.mockImplementation(() => ({
      ...window,
      navigator: {
        ...window.navigator,
        onLine: true
      }
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Firebase Initialization', () => {
    test('initializes Firebase services correctly', async () => {
      const { messaging, firestore } = await initializeFirebase();
      expect(messaging).toBeDefined();
      expect(firestore).toBeDefined();
    });

    test('handles offline initialization gracefully', async () => {
      // Simulate offline
      window.navigator.onLine = false;
      
      const result = await initializeFirebase();
      expect(result.messaging).toBeNull();
      expect(result.firestore).toBeNull();
    });
  });

  describe('Token Management', () => {
    test('gets FCM token successfully when online', async () => {
      const token = await getFCMToken();
      expect(token).toBe(mockToken);
    });

    test('handles token request when offline', async () => {
      window.navigator.onLine = false;
      const token = await getFCMToken();
      expect(token).toBeNull();
    });

    test('saves token to Firestore with validation', async () => {
      const saveResult = await saveTokenToFirestore(mockToken);
      expect(saveResult).toBe(true);
    });
  });

  describe('Permission Management', () => {
    test('requests notification permission successfully', async () => {
      const permission = await requestNotificationPermission();
      expect(permission).toBe('granted');
    });

    test('handles permission denial gracefully', async () => {
      vi.spyOn(window.Notification, 'requestPermission')
        .mockResolvedValueOnce('denied');
      
      const permission = await requestNotificationPermission();
      expect(permission).toBe('denied');
    });
  });

  describe('Message Handling', () => {
    test('sets up foreground message listener', () => {
      const mockCallback = vi.fn();
      const unsubscribe = setupForegroundMessageListener(mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    test('handles messages when offline', () => {
      window.navigator.onLine = false;
      const mockCallback = vi.fn();
      
      const unsubscribe = setupForegroundMessageListener(mockCallback);
      expect(typeof unsubscribe).toBe('function');
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});
