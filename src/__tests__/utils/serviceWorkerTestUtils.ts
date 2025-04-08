
import { vi } from 'vitest';

/**
 * Mock for a service worker registration
 */
export const createMockServiceWorkerRegistration = () => {
  return {
    installing: null,
    waiting: null,
    active: {
      postMessage: vi.fn(),
      state: 'activated'
    },
    scope: '/app/',
    updatefound: vi.fn(),
    update: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    unregister: vi.fn(),
    getNotifications: vi.fn().mockResolvedValue([])
  } as unknown as ServiceWorkerRegistration;
};

/**
 * Mock for service worker container
 */
export const createMockServiceWorkerContainer = (registration: ServiceWorkerRegistration) => {
  return {
    controller: {
      state: 'activated',
      postMessage: vi.fn()
    } as unknown as ServiceWorker,
    ready: Promise.resolve(registration),
    register: vi.fn().mockResolvedValue(registration),
    getRegistration: vi.fn().mockResolvedValue(registration),
    getRegistrations: vi.fn().mockResolvedValue([registration]),
    startMessages: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  } as unknown as ServiceWorkerContainer;
};

/**
 * Mock for the network status utility
 */
export const createMockNetworkStatus = () => {
  const listeners = new Set<(online: boolean) => void>();
  let isOnline = true;
  
  return {
    isOnline: () => isOnline,
    setOnline: (online: boolean) => {
      isOnline = online;
      listeners.forEach(listener => listener(online));
    },
    addStatusListener: vi.fn().mockImplementation((listener: (online: boolean) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    })
  };
};

/**
 * Mock for the offline queue
 */
export const createMockOfflineQueue = () => {
  return {
    addToQueue: vi.fn().mockResolvedValue('mock-queue-item-id'),
    getQueueSize: vi.fn().mockResolvedValue(0),
    processQueue: vi.fn().mockResolvedValue(true),
    clearQueue: vi.fn().mockResolvedValue(true),
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'mock-id-1',
        action: 'view',
        reminderId: 'reminder-123',
        data: { timestamp: Date.now() },
        timestamp: Date.now()
      },
      {
        id: 'mock-id-2',
        action: 'complete',
        reminderId: 'reminder-456',
        data: { timestamp: Date.now() - 3600000 },
        timestamp: Date.now() - 3600000
      }
    ])
  };
};

/**
 * Full service worker mock setup
 */
export const mockServiceWorker = () => {
  const registration = createMockServiceWorkerRegistration();
  const container = createMockServiceWorkerContainer(registration);
  const networkStatus = createMockNetworkStatus();
  
  // Set up message handler
  const messageListeners = new Set<(event: MessageEvent) => void>();
  container.addEventListener.mockImplementation((type, listener) => {
    if (type === 'message' && typeof listener === 'function') {
      messageListeners.add(listener);
    }
  });
  
  container.removeEventListener.mockImplementation((type, listener) => {
    if (type === 'message' && typeof listener === 'function') {
      messageListeners.delete(listener);
    }
  });
  
  // Helper to simulate message from service worker
  const postMessageFromServiceWorker = (message: any) => {
    const messageEvent = {
      data: message,
      source: {
        state: 'activated',
        postMessage: vi.fn()
      } as unknown as MessageEventSource
    } as MessageEvent;
    
    messageListeners.forEach(listener => listener(messageEvent));
  };
  
  return {
    registration,
    container,
    networkStatus,
    postMessageFromServiceWorker
  };
};

/**
 * Helper function to mock the notification API
 */
export const mockNotification = () => {
  const originalNotification = global.Notification;
  
  // Mock notification implementation
  class MockNotification {
    static permission: NotificationPermission = 'default';
    
    static requestPermission = vi.fn().mockResolvedValue('granted');
    
    title: string;
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
    
    constructor(title: string, options?: NotificationOptions) {
      this.title = title;
      this.body = options?.body;
      this.icon = options?.icon;
      this.tag = options?.tag;
      this.data = options?.data;
    }
    
    close = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn().mockReturnValue(true);
  }
  
  // Replace global notification
  global.Notification = MockNotification as any;
  
  // Helper to restore original notification
  const restore = () => {
    global.Notification = originalNotification;
  };
  
  return {
    mockNotification: MockNotification,
    restore
  };
};

export const waitForPromiseResolution = async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
};
