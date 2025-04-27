
import { vi } from 'vitest';
import { ComponentType } from 'react';
import { prettyDOM, logRoles, screen } from '@testing-library/react';

/**
 * Enhanced logging for test debugging with DOM inspection
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
  },

  // DOM inspection methods
  dom: {
    logStructure: (element: Element | null, maxDepth = 7) => {
      if (!element) {
        console.warn('[TEST DOM] No element provided for inspection');
        return;
      }
      console.log('\n[TEST DOM] Structure:', prettyDOM(element as HTMLElement, maxDepth));
    },

    logRoles: (element: Element | null) => {
      if (!element) {
        console.warn('[TEST DOM] No element provided for role inspection');
        return;
      }
      console.log('\n[TEST DOM] Accessible Roles:');
      logRoles(element as HTMLElement);
    },

    logElement: (element: Element | null) => {
      if (!element) {
        console.warn('[TEST DOM] No element provided for inspection');
        return;
      }
      
      const attributes = Array.from(element.attributes)
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');
        
      console.log(`\n[TEST DOM] Element Details:
        Tag: ${element.tagName.toLowerCase()}
        Attributes: ${attributes}
        Text Content: ${element.textContent}
        Classes: ${element.className}
        ARIA Role: ${element.getAttribute('role')}
        ARIA Label: ${element.getAttribute('aria-label')}
      `);
    },

    logCalendar: (element: Element | null) => {
      if (!element) {
        console.warn('[TEST DOM] No calendar element provided for inspection');
        return;
      }

      console.log('\n[TEST DOM] Calendar Structure:');
      console.log('----- Calendar Element -----');
      testLogger.dom.logElement(element);
      
      console.log('----- Calendar Days -----');
      const days = element.querySelectorAll('[role="gridcell"]');
      days.forEach((day, index) => {
        console.log(`Day ${index + 1}:`);
        testLogger.dom.logElement(day);
      });
    }
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
export type TestComponentType = ComponentType<{
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
      // Use proper React import
      return ComponentType<any>;
    } catch (error) {
      testLogger.error('Error rendering component:', error);
      return null;
    }
  };
};

/**
 * Inspect DOM for Shadcn Calendar
 */
export const inspectCalendar = async () => {
  try {
    const calendar = await screen.findByRole('dialog', { name: 'Calendar' });
    testLogger.dom.logStructure(calendar);
    testLogger.dom.logRoles(calendar);
    console.log('\n[TEST DOM] Calendar Grid Structure:');
    const gridCells = calendar.querySelectorAll('[role="gridcell"]');
    gridCells.forEach((cell, index) => {
      testLogger.dom.logElement(cell);
    });
  } catch (error) {
    testLogger.error('Failed to inspect calendar:', error);
  }
};
