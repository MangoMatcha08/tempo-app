
import { vi } from 'vitest';

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

// Add any additional test setup here
