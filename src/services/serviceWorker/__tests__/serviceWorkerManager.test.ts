
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServiceWorkerManager } from '../serviceWorkerManager';
import { mockServiceWorker, createMockOfflineQueue } from '@/__tests__/utils/serviceWorkerTestUtils';

describe('ServiceWorkerManager', () => {
  // Mock navigator.serviceWorker
  let mockSW: ReturnType<typeof mockServiceWorker>;
  let serviceWorkerManager: ServiceWorkerManager;
  
  beforeEach(() => {
    // Set up mocks
    mockSW = mockServiceWorker();
    
    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: mockSW.container,
      writable: true
    });
    
    // Create new instance for each test
    serviceWorkerManager = new ServiceWorkerManager();
  });
  
  afterEach(() => {
    // Clean up
    serviceWorkerManager.cleanup();
    vi.resetAllMocks();
  });
  
  it('should initialize successfully when service worker is supported', async () => {
    const result = await serviceWorkerManager.init();
    expect(result).toBe(true);
    expect(mockSW.container.getRegistration).toHaveBeenCalled();
  });
  
  it('should return false when service worker is not supported', async () => {
    // Remove serviceWorker from navigator
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: undefined,
      writable: true
    });
    
    const result = await serviceWorkerManager.init();
    expect(result).toBe(false);
  });
  
  it('should send messages to service worker', async () => {
    // Initialize
    await serviceWorkerManager.init();
    
    // Send message
    const result = await serviceWorkerManager.sendMessage({
      type: 'SKIP_WAITING',
      payload: {}
    });
    
    expect(result).toBe(true);
    expect(mockSW.registration.active.postMessage).toHaveBeenCalledWith({
      type: 'SKIP_WAITING',
      payload: {}
    });
  });
  
  it('should receive messages from service worker', async () => {
    // Initialize
    await serviceWorkerManager.init();
    
    // Set up listener
    const listener = vi.fn();
    const unsubscribe = serviceWorkerManager.addMessageListener('NOTIFICATION_CLICKED', listener);
    
    // Simulate message from service worker
    mockSW.postMessageFromServiceWorker({
      type: 'NOTIFICATION_CLICKED',
      payload: {
        reminderId: 'test-123',
        action: 'view'
      }
    });
    
    // Check listener called
    expect(listener).toHaveBeenCalledWith({
      type: 'NOTIFICATION_CLICKED',
      payload: {
        reminderId: 'test-123',
        action: 'view'
      }
    });
    
    // Unsubscribe
    unsubscribe();
    
    // Send another message
    mockSW.postMessageFromServiceWorker({
      type: 'NOTIFICATION_CLICKED',
      payload: {
        reminderId: 'test-456',
        action: 'view'
      }
    });
    
    // Listener should not have been called again
    expect(listener).toHaveBeenCalledTimes(1);
  });
  
  it('should handle network status changes', async () => {
    // Initialize
    await serviceWorkerManager.init();
    
    // Mock offline queue
    const offlineQueue = createMockOfflineQueue();
    
    // Set offline mode
    mockSW.networkStatus.setOnline(false);
    
    // Try to send an action
    await serviceWorkerManager.sendNotificationAction('view', 'reminder-123');
    
    // Should have queued the action
    expect(offlineQueue.add).toHaveBeenCalled();
    
    // Set online mode
    mockSW.networkStatus.setOnline(true);
    
    // Should have processed the queue
    expect(mockSW.registration.active.postMessage).toHaveBeenCalled();
  });
});
