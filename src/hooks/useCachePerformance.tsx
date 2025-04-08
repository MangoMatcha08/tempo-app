
import { useState, useEffect, useRef } from 'react';

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  averageAccessTime: number;
  cacheSize: number;
  memoryUsage: number | null;
}

/**
 * Cache monitoring options
 */
interface CacheMonitoringOptions {
  enabled?: boolean;
  logToConsole?: boolean;
  logFrequency?: number; // In milliseconds
  sampleRate?: number; // 0-1 percentage of operations to measure
}

/**
 * Hook for monitoring cache performance
 */
export const useCachePerformance = (options: CacheMonitoringOptions = {}) => {
  const {
    enabled = true,
    logToConsole = false,
    logFrequency = 60000, // Log every minute by default
    sampleRate = 0.1 // Only measure 10% of operations by default
  } = options;

  // Metrics state
  const [metrics, setMetrics] = useState<CacheMetrics>({
    hits: 0,
    misses: 0,
    hitRate: 0,
    averageAccessTime: 0,
    cacheSize: 0,
    memoryUsage: null
  });

  // Internal counters as refs to avoid re-renders
  const counters = useRef({
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    accessCount: 0,
    cacheSize: 0
  });
  
  // Logger interval ref
  const logIntervalRef = useRef<number | null>(null);
  
  // Initialize and cleanup
  useEffect(() => {
    if (!enabled) return;
    
    // Setup logging interval if enabled
    if (logToConsole) {
      logIntervalRef.current = window.setInterval(() => {
        logMetrics();
      }, logFrequency);
    }
    
    // Cleanup on unmount
    return () => {
      if (logIntervalRef.current !== null) {
        window.clearInterval(logIntervalRef.current);
      }
    };
  }, [enabled, logToConsole, logFrequency]);
  
  // Calculate current memory usage if supported
  const measureMemoryUsage = (): number | null => {
    if (window.performance && 'memory' in window.performance) {
      // @ts-ignore - memory is not in the standard TypeScript definitions
      return window.performance.memory.usedJSHeapSize;
    }
    return null;
  };
  
  // Update the metrics state from current counters
  const updateMetrics = () => {
    const totalOperations = counters.current.hits + counters.current.misses;
    const hitRate = totalOperations === 0 ? 0 : counters.current.hits / totalOperations;
    const avgAccessTime = counters.current.accessCount === 0 
      ? 0 
      : counters.current.totalAccessTime / counters.current.accessCount;
    
    setMetrics({
      hits: counters.current.hits,
      misses: counters.current.misses,
      hitRate,
      averageAccessTime: avgAccessTime,
      cacheSize: counters.current.cacheSize,
      memoryUsage: measureMemoryUsage()
    });
    
    return {
      hits: counters.current.hits,
      misses: counters.current.misses,
      hitRate,
      averageAccessTime: avgAccessTime,
      cacheSize: counters.current.cacheSize,
      memoryUsage: measureMemoryUsage()
    };
  };
  
  // Log current metrics to console
  const logMetrics = () => {
    const currentMetrics = updateMetrics();
    console.log('Cache Performance Metrics:', {
      ...currentMetrics,
      hitRate: `${(currentMetrics.hitRate * 100).toFixed(1)}%`,
      averageAccessTime: `${currentMetrics.averageAccessTime.toFixed(2)}ms`,
      memoryUsage: currentMetrics.memoryUsage 
        ? `${(currentMetrics.memoryUsage / 1048576).toFixed(2)}MB` 
        : 'Not available'
    });
  };
  
  // Record a cache hit
  const recordHit = (accessTime: number, size: number = 0) => {
    if (!enabled || Math.random() > sampleRate) return;
    
    counters.current.hits += 1;
    counters.current.totalAccessTime += accessTime;
    counters.current.accessCount += 1;
    
    if (size > 0) {
      counters.current.cacheSize = size;
    }
  };
  
  // Record a cache miss
  const recordMiss = (accessTime: number, size: number = 0) => {
    if (!enabled || Math.random() > sampleRate) return;
    
    counters.current.misses += 1;
    counters.current.totalAccessTime += accessTime;
    counters.current.accessCount += 1;
    
    if (size > 0) {
      counters.current.cacheSize = size;
    }
  };
  
  // Reset all metrics
  const resetMetrics = () => {
    counters.current = {
      hits: 0,
      misses: 0,
      totalAccessTime: 0,
      accessCount: 0,
      cacheSize: 0
    };
    updateMetrics();
  };
  
  return {
    metrics,
    recordHit,
    recordMiss,
    resetMetrics,
    updateMetrics,
    logMetrics
  };
};

export default useCachePerformance;
