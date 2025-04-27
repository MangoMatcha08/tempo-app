
import * as React from 'react';
import { prettyDOM, logRoles, screen } from '@testing-library/react';
import { vi } from 'vitest';

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
      console.log('\n[TEST DOM] Structure:', prettyDOM(element, maxDepth, { highlight: false }));
    },

    logRoles: (element: Element | null) => {
      if (!element) {
        console.warn('[TEST DOM] No element provided for role inspection');
        return;
      }
      logRoles(element);
    },

    logElement: (element: Element | null) => {
      if (!element) {
        console.warn('[TEST DOM] No element provided for inspection');
        return;
      }
      
      if (element instanceof HTMLElement) {
        const attributes = Array.from(element.attributes)
          .map(attr => `${attr.name}="${attr.value}"`)
          .join(' ');
          
        console.log(`\n[TEST DOM] Element Details:
          Tag: ${element.tagName.toLowerCase()}
          Attributes: ${attributes}
          Text Content: ${element.textContent}
          Classes: ${element.className}
        `);
      } else {
        console.log(`\n[TEST DOM] Element Details (non-HTMLElement):
          Node Name: ${element.nodeName}
          Node Type: ${element.nodeType}
          Text Content: ${element.textContent}
        `);
      }
    },

    logCalendar: (element: Element | null) => {
      if (!element) {
        console.warn('[TEST DOM] No calendar element provided for inspection');
        return;
      }

      console.log('\n[TEST DOM] Calendar Structure:');
      console.log('----- Calendar Element -----');
      testLogger.dom.logElement(element);
      
      console.log('----- First Three Calendar Days -----');
      const days = element.querySelectorAll('[role="gridcell"]');
      Array.from(days).slice(0, 3).forEach((day, index) => {
        console.log(`Day ${index + 1}:`);
        testLogger.dom.logElement(day);
      });
      
      if (days.length > 3) {
        console.log(`... and ${days.length - 3} more days`);
      }
    }
  }
};

/**
 * Create a mock for date-specific operations
 */
export const createDateMock = (baseDate?: string | Date) => {
  const date = baseDate ? new Date(baseDate) : new Date('2024-04-27T12:00:00Z');
  
  return {
    date,
    formatFn: vi.fn((d) => d.toISOString()),
    parseFn: vi.fn(() => date),
    validateFn: vi.fn(() => ({ isValid: true, errors: [] })),
  };
};

interface TestRenderOptions {
  debug?: boolean;
}

/**
 * Debug wrapper for components
 */
export const createTestRender = (options: TestRenderOptions = {}) => {
  return (Component: React.ComponentType<any>, props: Record<string, any> = {}) => {
    if (options.debug) {
      testLogger.debug('Rendering component with props:', props);
    }
    
    try {
      return React.createElement(Component, props);
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
    testLogger.dom.logCalendar(calendar);
  } catch (error) {
    testLogger.error('Failed to inspect calendar:', error);
  }
};
