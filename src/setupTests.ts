
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock browser APIs if needed
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

// Setup DOM environment
Object.defineProperty(window, 'document', {
  writable: true,
  value: document,
});

// Mock window properties commonly used in tests
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

// Add any additional test setup here

