
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock service worker
class MockServiceWorkerContainer {
  controller = {
    postMessage: vi.fn()
  };
  ready = Promise.resolve({
    active: {
      postMessage: vi.fn()
    }
  });
  register = vi.fn().mockResolvedValue({
    active: {
      postMessage: vi.fn()
    },
    update: vi.fn()
  });
  getRegistration = vi.fn().mockResolvedValue({
    active: {
      postMessage: vi.fn()
    },
    unregister: vi.fn()
  });
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
};

// Mock browser APIs
global.matchMedia = global.matchMedia || function(query: string) {
  return {
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};

// Mock service worker if not already defined
if (typeof navigator !== 'undefined' && !('serviceWorker' in navigator)) {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: new MockServiceWorkerContainer(),
    configurable: true,
    writable: true
  });
}

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn().mockImplementation(() => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null
  })),
  deleteDatabase: vi.fn()
};

// Add mockIndexedDB to the global object if not already defined
if (typeof indexedDB === 'undefined') {
  Object.defineProperty(global, 'indexedDB', {
    value: mockIndexedDB,
    configurable: true,
    writable: true
  });
}

// Mock clients API for service worker tests
const mockClients = {
  matchAll: vi.fn().mockResolvedValue([]),
  claim: vi.fn().mockResolvedValue(undefined),
  openWindow: vi.fn()
};

// Mock caches API for service worker tests
const mockCaches = {
  open: vi.fn().mockImplementation(() => ({
    addAll: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(undefined)
  })),
  keys: vi.fn().mockResolvedValue([]),
  match: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(true)
};

// Add mockClients and mockCaches to the global object if running in a service worker test context
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  Object.defineProperty(self, 'clients', {
    value: mockClients,
    configurable: true,
    writable: true
  });
  
  Object.defineProperty(self, 'caches', {
    value: mockCaches,
    configurable: true,
    writable: true
  });
}

// Any additional test setup

