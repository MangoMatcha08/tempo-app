
import { ServiceWorkerConfig } from '@/types/notifications/serviceWorkerTypes';
import { vi } from 'vitest';

/**
 * Test utility to mock service worker registration
 */
export const mockServiceWorkerRegistration = () => {
  const registration = {
    installing: null,
    waiting: null,
    active: {
      state: 'activated',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      postMessage: vi.fn()
    },
    scope: '/',
    updatefound: false,
    onupdatefound: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(true),
    showNotification: vi.fn().mockResolvedValue(undefined),
    getNotifications: vi.fn().mockResolvedValue([]),
    sync: {
      register: vi.fn().mockResolvedValue(undefined),
      getTags: vi.fn().mockResolvedValue(['sync-reminders'])
    }
  };

  // Mock the navigator.serviceWorker
  Object.defineProperty(global.navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue(registration),
      getRegistration: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
      controller: {
        postMessage: vi.fn()
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    configurable: true
  });

  return {
    registration,
    cleanup: () => {
      // Reset navigator.serviceWorker
      delete (global.navigator as any).serviceWorker;
    }
  };
};

/**
 * Create a test service worker message
 */
export const createServiceWorkerMessage = (
  type: string,
  payload: Record<string, any> = {}
) => {
  return {
    type,
    payload
  };
};

/**
 * Test utility to mock service worker messaging
 */
export const mockServiceWorkerMessaging = () => {
  const messages: any[] = [];
  const listeners: Function[] = [];
  
  // Mock postMessage
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage = vi.fn((message) => {
      messages.push(message);
    });
  }
  
  // Mock addEventListener
  const originalAddEventListener = navigator.serviceWorker.addEventListener;
  navigator.serviceWorker.addEventListener = vi.fn((event, callback) => {
    if (event === 'message') {
      listeners.push(callback);
    }
    return originalAddEventListener.call(navigator.serviceWorker, event, callback);
  });
  
  // Function to simulate receiving a message
  const simulateMessage = (message: any) => {
    const event = new MessageEvent('message', {
      data: message
    });
    
    listeners.forEach(callback => callback(event));
  };
  
  return {
    messages,
    simulateMessage,
    cleanup: () => {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        (navigator.serviceWorker.controller.postMessage as ReturnType<typeof vi.fn>).mockRestore();
      }
      (navigator.serviceWorker.addEventListener as ReturnType<typeof vi.fn>).mockRestore();
    }
  };
};

/**
 * Test function to validate service worker config
 */
export const validateServiceWorkerConfig = (config: ServiceWorkerConfig): boolean => {
  const requiredKeys = ['implementation', 'enableSync', 'cacheVersion', 'debug'];
  
  // Check that all required keys exist
  const hasAllKeys = requiredKeys.every(key => key in config);
  
  // Check implementation value is valid
  const validImplementation = config.implementation === 'legacy' || 
                              config.implementation === 'enhanced';
  
  return hasAllKeys && validImplementation;
};

/**
 * Mock fetch for testing offline behavior 
 */
export const mockOfflineEnvironment = () => {
  const originalFetch = global.fetch;
  const originalOnLine = navigator.onLine;
  
  // Mock offline state
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false
  });
  
  // Mock fetch to fail with network error
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
  
  return {
    cleanup: () => {
      global.fetch = originalFetch;
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine
      });
    },
    // Function to simulate coming online
    goOnline: () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      global.fetch = originalFetch;
      
      // Dispatch online event
      window.dispatchEvent(new Event('online'));
    },
    // Function to simulate going offline
    goOffline: () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      // Dispatch offline event
      window.dispatchEvent(new Event('offline'));
    }
  };
};
