
import { vi } from 'vitest';

/**
 * Enhanced logging for test debugging
 */
export const testLogger = {
  debug: (message: string, ...args: any[]) => {
    if (process.env.DEBUG_TESTS === 'true') {
      console.log(`[TEST DEBUG] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[TEST ERROR] ${message}`, ...args);
  },
  
  info: (message: string, ...args: any[]) => {
    console.info(`[TEST INFO] ${message}`, ...args);
  },
  
  group: (name: string) => {
    console.group(`[TEST GROUP] ${name}`);
  },
  
  groupEnd: () => {
    console.groupEnd();
  }
};

/**
 * Create a mock for date-specific operations
 */
export const createDateMock = (baseDate?: string | Date) => {
  const date = baseDate ? new Date(baseDate) : new Date('2024-04-27T12:00:00Z');
  
  const dateMock = {
    date,
    formatFn: vi.fn((d) => d.toISOString()),
    parseFn: vi.fn(() => date),
    validateFn: vi.fn(() => ({ isValid: true, errors: [] })),
  };
  
  return dateMock;
};

/**
 * Enhanced error handler for test failures
 */
export const withErrorHandling = async <T>(
  testFunction: () => Promise<T> | T,
  errorMessage = 'Test failed with error'
): Promise<T> => {
  try {
    return await testFunction();
  } catch (error) {
    testLogger.error(`${errorMessage}:`, error);
    throw error;
  }
};

/**
 * Simple component type for test wrappers
 */
export type TestComponentType = React.ComponentType<{
  [key: string]: any;
}>;

/**
 * Debug wrapper for components with useful fallbacks
 */
export const createTestRender = (options: { debug?: boolean } = {}) => {
  return (Component: TestComponentType, props: any = {}) => {
    if (options.debug) {
      testLogger.debug('Rendering component with props:', props);
    }
    
    try {
      return Component(props);
    } catch (error) {
      testLogger.error('Error rendering component:', error);
      return <div data-testid="render-error">Component render failed</div>;
    }
  };
};
