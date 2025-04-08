
import { ServiceWorkerConfig } from '@/types/notifications/serviceWorkerTypes';

/**
 * Test utility to mock service worker registration
 */
export const mockServiceWorkerRegistration = () => {
  const registration = {
    installing: null,
    waiting: null,
    active: {
      state: 'activated',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn()
    },
    scope: '/',
    updatefound: false,
    onupdatefound: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    unregister: jest.fn().mockResolvedValue(true),
    showNotification: jest.fn().mockResolvedValue(undefined),
    getNotifications: jest.fn().mockResolvedValue([]),
    sync: {
      register: jest.fn().mockResolvedValue(undefined),
      getTags: jest.fn().mockResolvedValue(['sync-reminders'])
    }
  };

  // Mock the navigator.serviceWorker
  Object.defineProperty(global.navigator, 'serviceWorker', {
    value: {
      register: jest.fn().mockResolvedValue(registration),
      getRegistration: jest.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
      controller: {
        postMessage: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
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
    navigator.serviceWorker.controller.postMessage = jest.fn((message) => {
      messages.push(message);
    });
  }
  
  // Mock addEventListener
  const originalAddEventListener = navigator.serviceWorker.addEventListener;
  navigator.serviceWorker.addEventListener = jest.fn((event, callback) => {
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
        (navigator.serviceWorker.controller.postMessage as jest.Mock).mockRestore();
      }
      (navigator.serviceWorker.addEventListener as jest.Mock).mockRestore();
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
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
  
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
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      // Dispatch offline event
      window.dispatchEvent(new Event('offline'));
    }
  };
};
