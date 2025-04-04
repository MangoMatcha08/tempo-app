
import { vi } from 'vitest';

// Mock browser APIs if needed
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
};

// Add any additional test setup here
