
/**
 * Performance monitoring utilities for date operations
 */

interface MeasurementEntry {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface DatePerformanceApi {
  enable: (enabled: boolean) => void;
  measureParse: <T>(fn: () => T, metadata?: Record<string, any>) => T;
  measureFormat: <T>(fn: () => T, metadata?: Record<string, any>) => T;
  measureGeneration: <T>(fn: () => T, metadata?: Record<string, any>) => T;
  generateReport: () => DatePerformanceReport;
  reset: () => void;
  dateOptimizationTips: {
    analyzeDateOperations: () => string[];
  };
}

export interface DatePerformanceReport {
  totalOperations: number;
  averageDuration: number;
  slowestOperation: MeasurementEntry | null;
  fastestOperation: MeasurementEntry | null;
  operationCounts: Record<string, number>;
  recentTrend: 'improving' | 'degrading' | 'stable';
}

// Create the performance monitoring singleton
class DatePerformanceMonitor implements DatePerformanceApi {
  private enabled = false;
  private measurements: MeasurementEntry[] = [];
  private maxMeasurements = 1000;
  
  enable(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  private measure<T>(operation: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.enabled) return fn();
    
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMeasurement({ operation, duration, timestamp: Date.now(), metadata });
    }
  }
  
  measureParse<T>(fn: () => T, metadata?: Record<string, any>): T {
    return this.measure('parse', fn, metadata);
  }
  
  measureFormat<T>(fn: () => T, metadata?: Record<string, any>): T {
    return this.measure('format', fn, metadata);
  }
  
  measureGeneration<T>(fn: () => T, metadata?: Record<string, any>): T {
    return this.measure('generation', fn, metadata);
  }
  
  private recordMeasurement(entry: MeasurementEntry): void {
    if (this.measurements.length >= this.maxMeasurements) {
      this.measurements.shift(); // Remove oldest entry
    }
    
    this.measurements.push(entry);
  }
  
  generateReport(): DatePerformanceReport {
    if (this.measurements.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationCounts: {},
        recentTrend: 'stable'
      };
    }
    
    // Calculate statistics
    let total = 0;
    const operationCounts: Record<string, number> = {};
    let slowest: MeasurementEntry = this.measurements[0];
    let fastest: MeasurementEntry = this.measurements[0];
    
    for (const entry of this.measurements) {
      total += entry.duration;
      
      if (!operationCounts[entry.operation]) {
        operationCounts[entry.operation] = 0;
      }
      operationCounts[entry.operation]++;
      
      if (entry.duration > slowest.duration) {
        slowest = entry;
      }
      
      if (entry.duration < fastest.duration) {
        fastest = entry;
      }
    }
    
    // Calculate trend
    const recentMeasurements = this.measurements.slice(-20);
    const firstHalf = recentMeasurements.slice(0, 10);
    const secondHalf = recentMeasurements.slice(10);
    
    let firstAvg = 0;
    let secondAvg = 0;
    
    if (firstHalf.length > 0) {
      firstAvg = firstHalf.reduce((sum, entry) => sum + entry.duration, 0) / firstHalf.length;
    }
    
    if (secondHalf.length > 0) {
      secondAvg = secondHalf.reduce((sum, entry) => sum + entry.duration, 0) / secondHalf.length;
    }
    
    let trend: 'improving' | 'degrading' | 'stable';
    
    if (secondAvg < firstAvg * 0.9) {
      trend = 'improving';
    } else if (secondAvg > firstAvg * 1.1) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }
    
    return {
      totalOperations: this.measurements.length,
      averageDuration: total / this.measurements.length,
      slowestOperation: slowest,
      fastestOperation: fastest,
      operationCounts,
      recentTrend: trend
    };
  }
  
  reset(): void {
    this.measurements = [];
  }
  
  get dateOptimizationTips() {
    return {
      analyzeDateOperations: (): string[] => {
        if (!this.enabled || this.measurements.length === 0) {
          return [];
        }
        
        const tips: string[] = [];
        const report = this.generateReport();
        
        // Check for slow parse operations
        const parseCount = report.operationCounts['parse'] || 0;
        if (parseCount > 10) {
          tips.push('Consider memoizing repeated date parsing operations');
        }
        
        // Check for excessive format operations
        const formatCount = report.operationCounts['format'] || 0;
        if (formatCount > 20) {
          tips.push('Reduce date formatting operations by formatting only when displaying');
        }
        
        // Check for slow generation operations
        if (report.recentTrend === 'degrading') {
          tips.push('Performance is degrading. Review recent date operations for inefficiencies');
        }
        
        return tips;
      }
    };
  }
}

// Export the singleton instance
export const datePerformance: DatePerformanceApi = new DatePerformanceMonitor();
