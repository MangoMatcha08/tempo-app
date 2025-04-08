/**
 * Performance measurement utilities for tracking and analyzing app performance
 */

// Check if the Performance API is available in the current environment
const isPerformanceSupported = typeof performance !== 'undefined' && 
  typeof performance.mark === 'function' && 
  typeof performance.measure === 'function';

// Operation categories for grouping measurements
export type OperationCategory = 
  | 'notification-load'   // Loading notification data
  | 'notification-render'  // Rendering notification components
  | 'notification-interaction' // User interactions with notifications
  | 'service-worker'      // Service worker operations
  | 'general';            // General app operations

interface PerformanceOptions {
  // Whether to log measurements to console automatically
  enableConsoleLogging?: boolean;
  // Sampling rate (0-1) to reduce measurement frequency
  samplingRate?: number;
  // Max number of entries to keep in memory
  maxEntries?: number;
}

interface PerformanceMeasurement {
  id: string;
  category: OperationCategory;
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private options: PerformanceOptions;
  private measurements: PerformanceMeasurement[] = [];
  private activeMarks: Map<string, { startTime: number, metadata?: Record<string, any> }> = new Map();
  
  constructor(options: PerformanceOptions = {}) {
    this.options = {
      enableConsoleLogging: options.enableConsoleLogging ?? false,
      samplingRate: options.samplingRate ?? 1.0,
      maxEntries: options.maxEntries ?? 100
    };
  }

  /**
   * Start timing an operation
   */
  startMark(name: string, category: OperationCategory = 'general', metadata?: Record<string, any>): string {
    // Apply sampling - skip some measurements based on sampling rate
    if (Math.random() > (this.options.samplingRate || 1.0)) {
      return '';
    }
    
    const id = `${category}:${name}:${Date.now()}`;
    
    if (isPerformanceSupported) {
      performance.mark(`start:${id}`);
    }
    
    this.activeMarks.set(id, { 
      startTime: performance.now(),
      metadata 
    });
    
    return id;
  }

  /**
   * End timing an operation and record the measurement
   */
  endMark(id: string): PerformanceMeasurement | null {
    if (!id || !this.activeMarks.has(id)) {
      return null;
    }
    
    const mark = this.activeMarks.get(id)!;
    const duration = performance.now() - mark.startTime;
    const [category, name] = id.split(':', 2) as [OperationCategory, string];
    
    if (isPerformanceSupported) {
      try {
        performance.mark(`end:${id}`);
        performance.measure(id, `start:${id}`, `end:${id}`);
      } catch (e) {
        console.error('Error creating performance measurement:', e);
      }
    }
    
    const measurement: PerformanceMeasurement = {
      id,
      category, 
      name,
      duration,
      timestamp: Date.now(),
      metadata: mark.metadata
    };
    
    this.measurements.push(measurement);
    this.activeMarks.delete(id);
    
    // Trim measurements array if it exceeds max entries
    if (this.measurements.length > (this.options.maxEntries || 100)) {
      this.measurements = this.measurements.slice(-this.options.maxEntries!);
    }
    
    // Log to console if enabled
    if (this.options.enableConsoleLogging) {
      console.log(`[Performance] ${category}:${name} - ${duration.toFixed(2)}ms`, mark.metadata || '');
    }
    
    return measurement;
  }

  /**
   * Measure an operation with automatic start/end
   */
  async measure<T>(
    name: string, 
    category: OperationCategory, 
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startMark(name, category, metadata);
    
    try {
      const result = await fn();
      return result;
    } finally {
      this.endMark(id);
    }
  }

  /**
   * Create a wrapper function that measures the time taken to execute the original function
   */
  createMeasuredFunction<T extends (...args: any[]) => any>(
    fn: T,
    name: string,
    category: OperationCategory
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      const id = this.startMark(name, category, { args: args.length });
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          this.endMark(id);
        }) as ReturnType<T>;
      } else {
        this.endMark(id);
        return result;
      }
    };
  }
  
  /**
   * Get measurements for analysis
   */
  getMeasurements(category?: OperationCategory): PerformanceMeasurement[] {
    if (category) {
      return this.measurements.filter(m => m.category === category);
    }
    return [...this.measurements];
  }
  
  /**
   * Get average duration for a specific operation
   */
  getAverageDuration(name: string, category?: OperationCategory): number {
    const filteredMeasurements = this.measurements.filter(m => 
      m.name === name && (!category || m.category === category)
    );
    
    if (filteredMeasurements.length === 0) {
      return 0;
    }
    
    const totalDuration = filteredMeasurements.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / filteredMeasurements.length;
  }
  
  /**
   * Clear all measurements
   */
  clearMeasurements(): void {
    this.measurements = [];
    this.activeMarks.clear();
    
    if (isPerformanceSupported) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
  
  /**
   * Export measurements as JSON
   */
  exportMeasurements(): string {
    return JSON.stringify(this.measurements);
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor({
  enableConsoleLogging: process.env.NODE_ENV !== 'production',
  samplingRate: 1.0,
  maxEntries: 200
});

// Helper hooks and functions for common operations
export const notificationPerformance = {
  // Start measuring loading notifications
  startLoadingNotifications: (metadata?: Record<string, any>) => 
    performanceMonitor.startMark('load-notifications', 'notification-load', metadata),
  
  // End measuring loading notifications
  endLoadingNotifications: (id: string) => 
    performanceMonitor.endMark(id),
  
  // Start measuring notification rendering
  startRenderingNotifications: (count: number) => 
    performanceMonitor.startMark('render-notifications', 'notification-render', { count }),
  
  // End measuring notification rendering
  endRenderingNotifications: (id: string) => 
    performanceMonitor.endMark(id),
  
  // Measure an interaction with a notification
  measureInteraction: (action: string, metadata?: Record<string, any>) => {
    return performanceMonitor.startMark(`interaction-${action}`, 'notification-interaction', metadata);
  },
  
  // Measure service worker operations
  measureServiceWorkerOperation: async <T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.measure(name, 'service-worker', fn, metadata);
  }
};

// React hook for component performance measurement
export function useComponentPerformance(componentName: string) {
  return {
    measureRender: (items?: number) => {
      const metadata = items ? { itemCount: items } : undefined;
      return performanceMonitor.startMark(`render-${componentName}`, 'notification-render', metadata);
    },
    measureOperation: async <T>(
      name: string, 
      fn: () => Promise<T>,
      metadata?: Record<string, any>
    ): Promise<T> => {
      return performanceMonitor.measure(
        `${componentName}-${name}`, 
        'notification-render', 
        fn, 
        metadata
      );
    }
  };
}
