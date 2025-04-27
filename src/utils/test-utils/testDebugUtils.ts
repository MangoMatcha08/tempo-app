import * as React from 'react';
import { prettyDOM, logRoles, screen, within } from '@testing-library/react';
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
      
      const attributes = Array.from(element.attributes || [])
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');
        
      console.log(`\n[TEST DOM] Element Details:
        Tag: ${element.tagName.toLowerCase()}
        Attributes: ${attributes}
        Text Content: ${element.textContent}
        Node Type: ${element.nodeType}
      `);

      if (element instanceof HTMLElement) {
        console.log(`Classes: ${element.className}`);
      }
    },

    logCalendar: (element: Element | null) => {
      if (!element) {
        console.warn('[TEST DOM] No calendar element provided for inspection');
        return;
      }

      console.log('\n[TEST DOM] Calendar Structure:');
      console.log('----- Calendar Element -----');
      
      const attributes = Array.from(element.attributes || [])
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');
        
      console.log(`Tag: ${element.tagName.toLowerCase()}`);
      console.log(`Attributes: ${attributes}`);
      console.log(`Text Content: ${element.textContent}`);
      
      if (element instanceof HTMLElement) {
        console.log(`Classes: ${element.className}`);
      }
      
      console.log('----- First Three Calendar Days -----');
      const days = within(element).queryAllByRole('gridcell');
      days.slice(0, 3).forEach((day, index) => {
        console.log(`Day ${index + 1}:`);
        const dayAttributes = Array.from(day.attributes || [])
          .map(attr => `${attr.name}="${attr.value}"`)
          .join(' ');
        console.log(`Tag: ${day.tagName.toLowerCase()}`);
        console.log(`Attributes: ${dayAttributes}`);
        console.log(`Text Content: ${day.textContent}`);
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
    
    if (calendar instanceof HTMLElement) {
      testLogger.dom.logCalendar(calendar);
    } else {
      testLogger.error('Calendar element is not an HTMLElement');
    }
  } catch (error) {
    testLogger.error('Failed to inspect calendar:', error);
  }
};
