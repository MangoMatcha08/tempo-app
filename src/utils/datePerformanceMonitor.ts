
import { performanceMonitor, OperationCategory } from './performanceUtils';
import { dateCache } from './dateOperationsCache';

/**
 * Performance metrics specifically for date operations
 */
export class DatePerformanceMonitor {
  private static instance: DatePerformanceMonitor;
  private isEnabled: boolean = false;
  private thresholds: Record<string, number> = {
    parse: 5, // ms
    format: 2, // ms
    generate: 20, // ms
    transform: 10, // ms
    cache: 1 // ms
  };
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DatePerformanceMonitor {
    if (!DatePerformanceMonitor.instance) {
      DatePerformanceMonitor.instance = new DatePerformanceMonitor();
    }
    return DatePerformanceMonitor.instance;
  }
  
  /**
   * Enable or disable performance monitoring
   */
  public enable(isEnabled: boolean): void {
    this.isEnabled = isEnabled;
  }
  
  /**
   * Set performance thresholds for warnings
   */
  public setThresholds(thresholds: Partial<Record<string, number>>): void {
    this.thresholds = {...this.thresholds, ...thresholds};
  }
  
  /**
   * Measure a date parsing operation
   */
  public measureParse<T>(fn: () => T, details: Record<string, any> = {}): T {
    if (!this.isEnabled) return fn();
    
    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    this.recordMetric('parse', duration, details);
    
    return result;
  }
  
  /**
   * Measure a date formatting operation
   */
  public measureFormat<T>(fn: () => T, details: Record<string, any> = {}): T {
    if (!this.isEnabled) return fn();
    
    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    this.recordMetric('format', duration, details);
    
    return result;
  }
  
  /**
   * Measure a pattern generation operation
   */
  public measureGeneration<T>(fn: () => T, details: Record<string, any> = {}): T {
    if (!this.isEnabled) return fn();
    
    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    this.recordMetric('generate', duration, details);
    
    return result;
  }
  
  /**
   * Measure a date transformation operation
   */
  public measureTransformation<T>(fn: () => T, details: Record<string, any> = {}): T {
    if (!this.isEnabled) return fn();
    
    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    this.recordMetric('transform', duration, details);
    
    return result;
  }
  
  /**
   * Record performance metric and log warning if above threshold
   */
  private recordMetric(
    operation: string, 
    duration: number, 
    details: Record<string, any>
  ): void {
    // Record with performance monitor
    performanceMonitor.startMark(
      `date-${operation}`, 
      'general' as OperationCategory, 
      { duration, ...details }
    );
    
    // Log warning if above threshold
    const threshold = this.thresholds[operation] || 10;
    if (duration > threshold) {
      console.warn(
        `Date operation "${operation}" took ${duration.toFixed(2)}ms, which exceeds the threshold of ${threshold}ms`,
        details
      );
    }
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStatistics(): {
    size: number;
    hitRate: number;
    missRate: number;
    averageAccessTime: number;
  } {
    // This is a placeholder - in a real implementation, these stats would come from the cache
    return {
      size: 0,
      hitRate: 0,
      missRate: 0,
      averageAccessTime: 0
    };
  }
  
  /**
   * Generate a performance report
   */
  public generateReport(): string {
    if (!this.isEnabled) return "Performance monitoring is disabled";
    
    const metrics = performanceMonitor.getMeasurements()
      .filter(m => m.name.startsWith('date-'));
      
    if (metrics.length === 0) {
      return "No date operations recorded";
    }
    
    // Group metrics by operation
    const operationGroups: Record<string, number[]> = {};
    metrics.forEach(metric => {
      const opName = metric.name.replace('date-', '');
      if (!operationGroups[opName]) {
        operationGroups[opName] = [];
      }
      operationGroups[opName].push(metric.duration);
    });
    
    // Calculate statistics for each operation
    const stats = Object.entries(operationGroups).map(([op, durations]) => {
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      return {
        operation: op,
        count: durations.length,
        avgDuration: avg.toFixed(2),
        maxDuration: max.toFixed(2),
        minDuration: min.toFixed(2)
      };
    });
    
    // Build report
    let report = "Date Operations Performance Report\n";
    report += "=====================================\n\n";
    
    stats.forEach(stat => {
      report += `Operation: ${stat.operation}\n`;
      report += `Count: ${stat.count}\n`;
      report += `Avg Duration: ${stat.avgDuration}ms\n`;
      report += `Max Duration: ${stat.maxDuration}ms\n`;
      report += `Min Duration: ${stat.minDuration}ms\n\n`;
    });
    
    // Add cache stats
    const cacheStats = this.getCacheStatistics();
    report += "Cache Statistics\n";
    report += "================\n";
    report += `Cache Size: ${cacheStats.size} entries\n`;
    report += `Hit Rate: ${(cacheStats.hitRate * 100).toFixed(2)}%\n`;
    report += `Miss Rate: ${(cacheStats.missRate * 100).toFixed(2)}%\n`;
    report += `Average Access Time: ${cacheStats.averageAccessTime.toFixed(2)}ms\n`;
    
    return report;
  }
  
  /**
   * Reset all performance metrics
   */
  public reset(): void {
    // Clear performance marks related to date operations
    performanceMonitor.clearMeasurements();
    
    // Reset cache statistics
    dateCache.clear();
  }
}

// Export singleton instance
export const datePerformance = DatePerformanceMonitor.getInstance();

// Helper hooks for performance optimization advice
export const dateOptimizationTips = {
  /**
   * Analyze date operations and provide optimization suggestions
   */
  analyzeDateOperations(): string[] {
    const tips: string[] = [];
    const metrics = performanceMonitor.getMeasurements()
      .filter(m => m.name.startsWith('date-'));
      
    // Count operation types
    const opCounts: Record<string, number> = {};
    metrics.forEach(m => {
      const op = m.name.replace('date-', '');
      opCounts[op] = (opCounts[op] || 0) + 1;
    });
    
    // Look for patterns suggesting optimization opportunities
    if (opCounts['parse'] > 50) {
      tips.push("Consider batch processing date parsing operations");
    }
    
    if (opCounts['format'] > 100) {
      tips.push("High number of formatting operations - consider memoizing formatDate calls");
    }
    
    if (opCounts['generate'] > 10) {
      tips.push("Multiple recurrence pattern generations - ensure you're caching results when possible");
    }
    
    // Get slow operations
    const slowOperations = metrics.filter(m => m.duration > 50);
    if (slowOperations.length > 0) {
      tips.push(`${slowOperations.length} operations took > 50ms - review for optimization opportunities`);
    }
    
    return tips;
  },
  
  /**
   * Get recommendations for cache configuration
   */
  getCacheRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // These would be based on actual cache statistics in a real implementation
    recommendations.push("Set cache expiry based on date volatility (1 minute for frequently changing dates)");
    recommendations.push("Consider increasing cache size for workloads with many unique date operations");
    recommendations.push("Use batch processing functions for operations on arrays of dates");
    
    return recommendations;
  }
};
