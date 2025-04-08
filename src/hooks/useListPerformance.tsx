
import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/utils/performanceUtils';

interface ListPerformanceOptions {
  componentName: string;
  itemCount: number;
  isVirtualized?: boolean;
  enableMemoryLogging?: boolean;
  logFrequency?: number; // In milliseconds
  enableDetailedLogging?: boolean;
}

/**
 * Hook for measuring list component performance
 */
export const useListPerformance = ({
  componentName,
  itemCount,
  isVirtualized = false,
  enableMemoryLogging = true,
  logFrequency = 5000, // Log every 5 seconds by default
  enableDetailedLogging = false
}: ListPerformanceOptions) => {
  const renderMarkId = useRef<string>('');
  const memoryLoggerRef = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);
  const scrollCount = useRef<number>(0);
  const performanceData = useRef({
    initialRenderTime: 0,
    averageScrollTime: 0,
    totalScrollTime: 0,
    scrollEvents: 0,
    peakMemoryUsage: 0,
    currentMemoryUsage: 0
  });
  
  // Clear any existing intervals on unmount
  useEffect(() => {
    return () => {
      if (memoryLoggerRef.current !== null) {
        window.clearInterval(memoryLoggerRef.current);
      }
    };
  }, []);
  
  // Start measuring performance on mount or when item count changes
  useEffect(() => {
    const renderStartTime = performance.now();
    
    // Start render timing
    renderMarkId.current = performanceMonitor.startMark(
      `render-${componentName}`, 
      'notification-render',
      { 
        itemCount, 
        isVirtualized,
        timestamp: Date.now()
      }
    );
    
    // Record initial render time after next tick
    setTimeout(() => {
      const renderTime = performance.now() - renderStartTime;
      performanceData.current.initialRenderTime = renderTime;
      
      if (enableDetailedLogging) {
        console.log(`[Performance] ${componentName} initial render: ${renderTime.toFixed(2)}ms (${itemCount} items, ${isVirtualized ? 'virtualized' : 'standard'})`);
      }
    }, 0);
    
    // Setup memory logging if enabled and supported by the browser
    if (enableMemoryLogging && window.performance && 'memory' in window.performance) {
      // Log initial memory usage
      logMemoryUsage(`${componentName}-initial`);
      
      // Set up interval for ongoing memory logging
      if (memoryLoggerRef.current !== null) {
        window.clearInterval(memoryLoggerRef.current);
      }
      
      memoryLoggerRef.current = window.setInterval(() => {
        logMemoryUsage(`${componentName}-ongoing`);
      }, logFrequency);
    }
    
    // End timing on cleanup
    return () => {
      if (renderMarkId.current) {
        performanceMonitor.endMark(renderMarkId.current);
        renderMarkId.current = '';
      }
      
      // Log final performance stats
      if (enableDetailedLogging) {
        const avgScrollTime = performanceData.current.scrollEvents > 0 
          ? performanceData.current.totalScrollTime / performanceData.current.scrollEvents 
          : 0;
          
        console.log(`[Performance] ${componentName} final stats:`, {
          render: `${performanceData.current.initialRenderTime.toFixed(2)}ms`,
          scrolling: `${avgScrollTime.toFixed(2)}ms avg (${performanceData.current.scrollEvents} events)`,
          memory: `${(performanceData.current.peakMemoryUsage / 1048576).toFixed(2)}MB peak`
        });
      }
    };
  }, [componentName, itemCount, isVirtualized, enableMemoryLogging, logFrequency, enableDetailedLogging]);
  
  // Helper to log memory usage
  const logMemoryUsage = useCallback((label: string) => {
    if (window.performance && 'memory' in window.performance) {
      // @ts-ignore - memory is not in the standard TypeScript definitions
      const usedHeapSize = window.performance.memory.usedJSHeapSize;
      // @ts-ignore
      const totalHeapSize = window.performance.memory.totalJSHeapSize;
      
      const usedMB = usedHeapSize / 1048576;
      const totalMB = totalHeapSize / 1048576;
      const percentUsed = ((usedHeapSize / totalHeapSize) * 100);
      
      // Update peak memory usage
      if (usedMB > performanceData.current.peakMemoryUsage) {
        performanceData.current.peakMemoryUsage = usedMB;
      }
      
      performanceData.current.currentMemoryUsage = usedMB;
      
      if (enableDetailedLogging) {
        console.log(
          `[Memory] ${label}: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (${percentUsed.toFixed(1)}%)`
        );
      }
      
      return { used: usedMB, total: totalMB, percent: percentUsed };
    }
    
    return null;
  }, [enableDetailedLogging]);
  
  // Track scroll performance
  const trackScrollPerformance = useCallback(() => {
    const now = performance.now();
    const timeSinceLastScroll = now - lastScrollTime.current;
    
    // Only track if enough time has passed since last scroll event
    if (timeSinceLastScroll > 100) {
      const scrollMarkId = performanceMonitor.startMark(
        `scroll-${componentName}-${scrollCount.current++}`,
        'notification-interaction',
        {
          itemCount,
          isVirtualized,
          timestamp: Date.now()
        }
      );
      
      // End the mark after measuring scroll render
      requestAnimationFrame(() => {
        const scrollTime = performance.now() - now;
        performanceData.current.totalScrollTime += scrollTime;
        performanceData.current.scrollEvents++;
        
        performanceMonitor.endMark(scrollMarkId);
        
        // Log detailed scroll performance
        if (enableDetailedLogging && performanceData.current.scrollEvents % 5 === 0) {
          const avgTime = performanceData.current.totalScrollTime / performanceData.current.scrollEvents;
          console.log(`[Scroll] ${componentName}: ${scrollTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms)`);
        }
      });
      
      lastScrollTime.current = now;
    }
  }, [componentName, itemCount, isVirtualized, enableDetailedLogging]);
  
  // Get current performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const memoryInfo = logMemoryUsage(`${componentName}-metrics`);
    
    return {
      componentName,
      itemCount,
      isVirtualized,
      initialRenderTime: performanceData.current.initialRenderTime,
      averageScrollTime: performanceData.current.scrollEvents > 0 
        ? performanceData.current.totalScrollTime / performanceData.current.scrollEvents 
        : 0,
      scrollEvents: performanceData.current.scrollEvents,
      memory: {
        current: performanceData.current.currentMemoryUsage,
        peak: performanceData.current.peakMemoryUsage,
        detailed: memoryInfo
      }
    };
  }, [componentName, itemCount, isVirtualized, logMemoryUsage]);
  
  return {
    trackScrollPerformance,
    logMemoryUsage: (label: string) => logMemoryUsage(`${componentName}-${label}`),
    getPerformanceMetrics
  };
};

export default useListPerformance;
