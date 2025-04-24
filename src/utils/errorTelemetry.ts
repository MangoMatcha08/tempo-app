
import { ErrorSeverity, ErrorCategory, ErrorResponse } from '@/hooks/useErrorHandler';
import { performanceReporter } from '@/utils/performanceAnalytics';
import { createMetadata } from '@/utils/telemetryUtils';
import { browserDetection } from '@/utils/browserDetection';

/**
 * Error telemetry system for monitoring and reporting errors
 */
export class ErrorTelemetrySystem {
  private static instance: ErrorTelemetrySystem;
  private errorCount: Record<string, number> = {};
  private samplingRate = 1.0; // Report all errors by default
  private buffer: ErrorResponse[] = [];
  private bufferSize = 10;
  private flushInterval: number | null = null;
  private performanceCorrelation: boolean = true;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorTelemetrySystem {
    if (!ErrorTelemetrySystem.instance) {
      ErrorTelemetrySystem.instance = new ErrorTelemetrySystem();
    }
    return ErrorTelemetrySystem.instance;
  }
  
  /**
   * Configure telemetry system
   */
  public configure(options: {
    samplingRate?: number;
    bufferSize?: number;
    autoFlushInterval?: number;
    performanceCorrelation?: boolean;
  }) {
    if (options.samplingRate !== undefined) {
      this.samplingRate = Math.min(1, Math.max(0, options.samplingRate));
    }
    
    if (options.bufferSize !== undefined) {
      this.bufferSize = options.bufferSize;
    }
    
    if (options.performanceCorrelation !== undefined) {
      this.performanceCorrelation = options.performanceCorrelation;
    }
    
    if (options.autoFlushInterval !== undefined) {
      this.setupAutoFlush(options.autoFlushInterval);
    }
  }
  
  /**
   * Set up auto-flush interval
   */
  private setupAutoFlush(intervalMs: number) {
    if (this.flushInterval) {
      window.clearInterval(this.flushInterval);
    }
    
    if (intervalMs > 0) {
      this.flushInterval = window.setInterval(() => {
        this.flushBuffer();
      }, intervalMs);
    }
  }
  
  /**
   * Report an error to telemetry
   */
  public reportError(error: ErrorResponse) {
    // Apply sampling rate
    if (Math.random() > this.samplingRate) {
      return;
    }
    
    // Track error count by code/source
    const errorKey = `${error.source || 'unknown'}:${error.code || 'unknown'}`;
    this.errorCount[errorKey] = (this.errorCount[errorKey] || 0) + 1;
    
    // Add to buffer
    this.buffer.push(error);
    
    // Auto-flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
    
    // Report critical errors immediately
    if (error.severity === ErrorSeverity.FATAL || error.severity === ErrorSeverity.HIGH) {
      this.reportCriticalError(error);
    }
  }
  
  /**
   * Report a performance-related error
   */
  public reportPerformanceError(metricName: string, currentValue: number, threshold: number, context?: Record<string, any>) {
    const errorResponse: ErrorResponse = {
      message: `Performance degradation detected in ${metricName}`,
      technicalDetails: `Current: ${currentValue}ms, Threshold: ${threshold}ms`,
      code: 'perf-degradation',
      source: 'performance-monitor',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      timestamp: Date.now(),
      metadata: {
        metricName,
        currentValue,
        threshold,
        device: browserDetection.isIOS() ? 'ios' : 'other',
        iosVersion: browserDetection.getIOSVersion(),
        ...context
      }
    };
    
    this.reportError(errorResponse);
  }
  
  /**
   * Immediately report a critical error
   */
  private reportCriticalError(error: ErrorResponse) {
    performanceReporter.reportInteraction('critical_error', {
      message: error.message,
      technical_details: error.technicalDetails,
      source: error.source,
      code: error.code,
      recoverable: error.recoverable,
      timestamp: error.timestamp,
      ...createMetadata('Critical error', error.metadata)
    });
  }
  
  /**
   * Flush buffered errors to analytics
   */
  public flushBuffer() {
    if (this.buffer.length === 0) return;
    
    // Group errors by type for batch reporting
    const groupedErrors = this.buffer.reduce((acc, error) => {
      const key = `${error.source || 'unknown'}:${error.code || 'unknown'}`;
      if (!acc[key]) {
        acc[key] = {
          source: error.source,
          code: error.code,
          count: 0,
          samples: []
        };
      }
      
      acc[key].count++;
      
      // Store a few samples of each error type
      if (acc[key].samples.length < 3) {
        acc[key].samples.push({
          message: error.message,
          technical_details: error.technicalDetails,
          timestamp: error.timestamp,
          metadata: error.metadata
        });
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Report batch of errors with enhanced metadata
    performanceReporter.reportInteraction('error_batch', { 
      errors: groupedErrors,
      total_count: this.buffer.length,
      ...createMetadata('Error batch', {
        deviceInfo: {
          isIOS: browserDetection.isIOS(),
          iosVersion: browserDetection.getIOSVersion(),
          isPWA: browserDetection.isIOSPWA()
        }
      })
    });
    
    // Clear buffer
    this.buffer = [];
  }
  
  /**
   * Get error statistics
   */
  public getErrorStats() {
    return {
      totalErrorCount: Object.values(this.errorCount).reduce((sum, count) => sum + count, 0),
      errorsByType: this.errorCount,
      bufferSize: this.buffer.length
    };
  }
  
  /**
   * Clean up resources
   */
  public cleanUp() {
    if (this.flushInterval) {
      window.clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushBuffer();
  }
}

// Singleton instance
export const errorTelemetry = ErrorTelemetrySystem.getInstance();

// Configure on import with default settings
if (typeof window !== 'undefined') {
  errorTelemetry.configure({
    samplingRate: 0.5, // Report 50% of errors
    bufferSize: 10,
    autoFlushInterval: 30000, // 30 seconds
    performanceCorrelation: true
  });
}
