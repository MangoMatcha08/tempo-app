
import { ErrorSeverity, ErrorCategory, ErrorResponse } from '@/hooks/useErrorHandler';
import { performanceReporter } from '@/utils/performanceAnalytics';

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
  }) {
    if (options.samplingRate !== undefined) {
      this.samplingRate = Math.min(1, Math.max(0, options.samplingRate));
    }
    
    if (options.bufferSize !== undefined) {
      this.bufferSize = options.bufferSize;
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
   * Immediately report a critical error
   */
  private reportCriticalError(error: ErrorResponse) {
    performanceReporter.reportInteraction('critical_error', {
      message: error.message,
      technical_details: error.technicalDetails,
      source: error.source,
      code: error.code,
      recoverable: error.recoverable,
      timestamp: error.timestamp
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
          timestamp: error.timestamp
        });
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Report batch of errors
    performanceReporter.reportInteraction('error_batch', { 
      errors: groupedErrors,
      total_count: this.buffer.length
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
    autoFlushInterval: 30000 // 30 seconds
  });
}
