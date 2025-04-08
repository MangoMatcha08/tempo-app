
import { OperationCategory, performanceMonitor } from './performanceUtils';

// Interface for analytics provider plugins
export interface AnalyticsProvider {
  sendEvent(eventName: string, properties: Record<string, any>): void;
  sendTiming(category: string, name: string, duration: number, metadata?: Record<string, any>): void;
}

// Dummy analytics provider for when no real provider is configured
class NoopAnalyticsProvider implements AnalyticsProvider {
  sendEvent(): void {}
  sendTiming(): void {}
}

/**
 * Performance analytics reporter
 */
export class PerformanceAnalyticsReporter {
  private provider: AnalyticsProvider = new NoopAnalyticsProvider();
  private reportingThreshold: number = 0; // ms
  private samplingRate: number = 1.0;
  
  /**
   * Set the analytics provider
   */
  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }
  
  /**
   * Configure the reporter
   */
  configure(options: {
    reportingThreshold?: number;
    samplingRate?: number;
  }): void {
    if (options.reportingThreshold !== undefined) {
      this.reportingThreshold = options.reportingThreshold;
    }
    if (options.samplingRate !== undefined) {
      this.samplingRate = Math.min(1, Math.max(0, options.samplingRate));
    }
  }
  
  /**
   * Report performance data to analytics
   */
  reportMeasurement(
    category: OperationCategory, 
    name: string, 
    duration: number,
    metadata?: Record<string, any>
  ): void {
    // Skip reporting based on threshold and sampling
    if (duration < this.reportingThreshold || Math.random() > this.samplingRate) {
      return;
    }
    
    this.provider.sendTiming(
      category,
      name,
      Math.round(duration),
      metadata
    );
  }
  
  /**
   * Report all collected measurements to analytics
   */
  reportAllMeasurements(filter?: (category: OperationCategory) => boolean): void {
    const measurements = performanceMonitor.getMeasurements();
    
    for (const measurement of measurements) {
      if (!filter || filter(measurement.category)) {
        this.reportMeasurement(
          measurement.category,
          measurement.name,
          measurement.duration,
          measurement.metadata
        );
      }
    }
  }
  
  /**
   * Report a significant user interaction
   */
  reportInteraction(action: string, properties: Record<string, any> = {}): void {
    this.provider.sendEvent(`notification_${action}`, properties);
  }
}

// Export singleton instance
export const performanceReporter = new PerformanceAnalyticsReporter();

// Example integration with Google Analytics (commented out - implement as needed)
/* 
export function initializeAnalyticsReporting(): void {
  if (typeof gtag === 'function') {
    // Create GA provider adapter
    const gaProvider: AnalyticsProvider = {
      sendEvent(eventName, properties) {
        gtag('event', eventName, properties);
      },
      sendTiming(category, name, duration, metadata = {}) {
        gtag('event', 'timing_complete', {
          name,
          value: duration,
          event_category: category,
          ...metadata
        });
      }
    };
    
    // Set GA as the provider
    performanceReporter.setProvider(gaProvider);
    
    // Configure threshold and sampling rate
    performanceReporter.configure({
      reportingThreshold: 100, // Only report slower operations
      samplingRate: 0.1 // Only report 10% of measurements
    });
  }
}
*/
