
import { ServiceWorkerMessage, AppMessage } from '@/types/notifications/serviceWorkerTypes';

/**
 * Mock service worker for testing
 */
export const mockServiceWorker = () => {
  // Create a mock service worker registration
  const mockRegistration = {
    active: {
      postMessage: vitest.fn(),
    },
    installing: null,
    waiting: null,
    scope: '/test/',
    updateFound: false,
    update: vitest.fn().mockResolvedValue(undefined),
    unregister: vitest.fn().mockResolvedValue(true),
    addEventListener: vitest.fn(),
    removeEventListener: vitest.fn(),
    onupdatefound: null,
    dispatchEvent: vitest.fn()
  };

  // Mock the navigator.serviceWorker object
  const mockServiceWorkerContainer = {
    controller: {
      state: 'activated',
      postMessage: vitest.fn(),
    },
    ready: Promise.resolve(mockRegistration),
    getRegistration: vitest.fn().mockResolvedValue(mockRegistration),
    register: vitest.fn().mockResolvedValue(mockRegistration),
    startMessages: vitest.fn(),
    addEventListener: vitest.fn(),
    removeEventListener: vitest.fn(),
    onmessage: null,
    oncontrollerchange: null,
    onmessageerror: null
  };

  // Mock functions for sending/receiving messages
  const messageListeners = new Set<(event: MessageEvent) => void>();
  
  // Mock for sending messages from the service worker
  const mockPostMessageFromServiceWorker = (message: ServiceWorkerMessage) => {
    const mockEvent = new MessageEvent('message', {
      data: message,
      source: mockServiceWorkerContainer.controller
    });
    
    messageListeners.forEach(listener => {
      listener(mockEvent);
    });
  };
  
  // Add a mock listener
  const mockAddMessageListener = (callback: (event: MessageEvent) => void) => {
    messageListeners.add(callback);
    return () => {
      messageListeners.delete(callback);
    };
  };

  // Simulate offline/online status changes
  const mockNetworkStatus = {
    online: true,
    setOnline: (status: boolean) => {
      mockNetworkStatus.online = status;
      const event = new Event(status ? 'online' : 'offline');
      window.dispatchEvent(event);
    }
  };

  // Mock for simulating service worker registration state
  const mockServiceWorkerState = {
    serviceWorkerSupported: true,
    setServiceWorkerSupport: (supported: boolean) => {
      mockServiceWorkerState.serviceWorkerSupported = supported;
    }
  };

  return {
    registration: mockRegistration,
    container: mockServiceWorkerContainer,
    postMessageFromServiceWorker: mockPostMessageFromServiceWorker,
    addMessageListener: mockAddMessageListener,
    networkStatus: mockNetworkStatus,
    serviceWorkerState: mockServiceWorkerState
  };
};

/**
 * Create a mock offline queue for testing
 */
export const createMockOfflineQueue = () => {
  let queue: Array<{
    action: string;
    data: any;
    timestamp: number;
  }> = [];

  return {
    add: (action: string, data: any) => {
      queue.push({
        action,
        data,
        timestamp: Date.now()
      });
      return Promise.resolve();
    },
    getAll: () => Promise.resolve([...queue]),
    remove: (index: number) => {
      if (index >= 0 && index < queue.length) {
        queue.splice(index, 1);
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    },
    clear: () => {
      queue = [];
      return Promise.resolve();
    },
    size: () => Promise.resolve(queue.length)
  };
};

/**
 * Mock service worker events for testing
 */
export const createServiceWorkerEventMock = () => {
  // Mock for install event
  const createInstallEvent = () => {
    const waitUntilPromises: Promise<any>[] = [];
    
    const installEvent = {
      waitUntil: (promise: Promise<any>) => {
        waitUntilPromises.push(promise);
      },
      type: 'install' as const,
      waitUntilSettled: () => Promise.all(waitUntilPromises)
    };
    
    return installEvent;
  };
  
  // Mock for activate event
  const createActivateEvent = () => {
    const waitUntilPromises: Promise<any>[] = [];
    
    const activateEvent = {
      waitUntil: (promise: Promise<any>) => {
        waitUntilPromises.push(promise);
      },
      type: 'activate' as const,
      waitUntilSettled: () => Promise.all(waitUntilPromises)
    };
    
    return activateEvent;
  };
  
  // Mock for notification click event
  const createNotificationClickEvent = (notification: Partial<Notification>, action = '') => {
    const notificationWithDefaults = {
      title: 'Test Notification',
      body: 'This is a test notification',
      data: {},
      tag: 'test-tag',
      close: vitest.fn(),
      ...notification
    };
    
    const waitUntilPromises: Promise<any>[] = [];
    
    const notificationClickEvent = {
      notification: notificationWithDefaults as Notification,
      action,
      waitUntil: (promise: Promise<any>) => {
        waitUntilPromises.push(promise);
      },
      type: 'notificationclick' as const,
      waitUntilSettled: () => Promise.all(waitUntilPromises)
    };
    
    return notificationClickEvent;
  };
  
  // Mock for fetch event
  const createFetchEvent = (request: Request | string) => {
    const req = typeof request === 'string' ? new Request(request) : request;
    const waitUntilPromises: Promise<any>[] = [];
    let responseValue: Response | undefined;
    
    const fetchEvent = {
      request: req,
      waitUntil: (promise: Promise<any>) => {
        waitUntilPromises.push(promise);
      },
      respondWith: (response: Promise<Response> | Response) => {
        if (response instanceof Promise) {
          response.then(res => {
            responseValue = res;
          });
        } else {
          responseValue = response;
        }
      },
      type: 'fetch' as const,
      waitUntilSettled: () => Promise.all(waitUntilPromises),
      getResponse: () => responseValue
    };
    
    return fetchEvent;
  };
  
  // Mock for push event
  const createPushEvent = (data?: any) => {
    const waitUntilPromises: Promise<any>[] = [];
    
    const pushEvent = {
      data: {
        json: () => data || { title: 'Test Push', body: 'This is a test push notification' },
        text: () => JSON.stringify(data || { title: 'Test Push', body: 'This is a test push notification' })
      },
      waitUntil: (promise: Promise<any>) => {
        waitUntilPromises.push(promise);
      },
      type: 'push' as const,
      waitUntilSettled: () => Promise.all(waitUntilPromises)
    };
    
    return pushEvent;
  };
  
  return {
    createInstallEvent,
    createActivateEvent,
    createNotificationClickEvent,
    createFetchEvent,
    createPushEvent
  };
};

/**
 * Testing environment simulation for service workers
 */
export const setupServiceWorkerTestEnvironment = () => {
  // Create mock indexedDB for offline testing
  const mockIndexedDB = {
    open: vitest.fn(),
    deleteDatabase: vitest.fn()
  };
  
  // Mock clients API
  const mockClients = {
    matchAll: vitest.fn().mockResolvedValue([]),
    claim: vitest.fn().mockResolvedValue(undefined),
    get: vitest.fn(),
    openWindow: vitest.fn()
  };
  
  // Mock caches API
  const mockCaches = {
    open: vitest.fn(),
    match: vitest.fn(),
    keys: vitest.fn().mockResolvedValue([]),
    delete: vitest.fn()
  };
  
  return {
    indexedDB: mockIndexedDB,
    clients: mockClients,
    caches: mockCaches
  };
};

/**
 * "Definition of done" criteria checker for service worker features
 */
export const checkServiceWorkerDefinitionOfDoneCriteria = (
  featureName: string,
  criteria: Record<string, boolean>,
  options?: {
    logResults?: boolean;
    requireAllCriteria?: boolean;
  }
) => {
  const { logResults = true, requireAllCriteria = true } = options || {};
  const allCriteriaMet = Object.values(criteria).every(Boolean);
  const someCriteriaMet = Object.values(criteria).some(Boolean);
  
  const result = requireAllCriteria ? allCriteriaMet : someCriteriaMet;
  
  if (logResults) {
    console.log(`Feature "${featureName}" definition of done: ${result ? 'COMPLETE' : 'INCOMPLETE'}`);
    
    // Log individual criteria status
    Object.entries(criteria).forEach(([name, met]) => {
      console.log(`- ${name}: ${met ? '✓' : '✗'}`);
    });
  }
  
  return result;
};

/**
 * Test utility to verify service worker behavior in different network conditions
 */
export const testServiceWorkerNetworkConditions = async (
  test: () => Promise<any>,
  networkConditions: Array<'online' | 'offline' | 'slow'> = ['online', 'offline', 'slow']
) => {
  const results: Record<string, { success: boolean; error?: Error }> = {};
  
  for (const condition of networkConditions) {
    try {
      // Set up network condition
      if (condition === 'offline') {
        // Mock offline state
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
        window.dispatchEvent(new Event('offline'));
      } else if (condition === 'slow') {
        // Mock slow connection
        Object.defineProperty(navigator, 'connection', { 
          configurable: true, 
          value: { effectiveType: '2g', saveData: true } 
        });
      } else {
        // Mock online state
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
        window.dispatchEvent(new Event('online'));
      }
      
      // Run the test
      await test();
      results[condition] = { success: true };
    } catch (error) {
      results[condition] = { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error)) 
      };
    }
  }
  
  // Reset network condition
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  window.dispatchEvent(new Event('online'));
  
  return results;
};
