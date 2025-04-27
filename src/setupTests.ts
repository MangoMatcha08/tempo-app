
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Run cleanup automatically between tests
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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

// Setup React test environment
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useEffect: vi.fn(actual.useEffect),
  };
});

// Mock toast hook since we don't need actual toast functionality in tests
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Add any additional test setup here
