
import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/utils/performanceUtils';

interface ListPerformanceOptions {
  componentName: string;
  itemCount: number;
  isVirtualized?: boolean;
  enableMemoryLogging?: boolean;
  logFrequency?: number; // In milliseconds
}

/**
 * Hook for measuring list component performance
 */
export const useListPerformance = ({
  componentName,
  itemCount,
  isVirtualized = false,
  enableMemoryLogging = true,
  logFrequency = 5000 // Log every 5 seconds by default
}: ListPerformanceOptions) => {
  const renderMarkId = useRef<string>('');
  const memoryLoggerRef = useRef<number | null>(null);
  
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
    };
  }, [componentName, itemCount, isVirtualized, enableMemoryLogging, logFrequency]);
  
  // Helper to log memory usage
  const logMemoryUsage = (label: string) => {
    if (window.performance && 'memory' in window.performance) {
      // @ts-ignore - memory is not in the standard TypeScript definitions
      const usedHeapSize = window.performance.memory.usedJSHeapSize;
      // @ts-ignore
      const totalHeapSize = window.performance.memory.totalJSHeapSize;
      
      const usedMB = (usedHeapSize / 1048576).toFixed(2);
      const totalMB = (totalHeapSize / 1048576).toFixed(2);
      const percentUsed = ((usedHeapSize / totalHeapSize) * 100).toFixed(1);
      
      console.log(
        `[Memory] ${label}: ${usedMB}MB / ${totalMB}MB (${percentUsed}%)`
      );
    }
  };
  
  // Track scroll performance
  const trackScrollPerformance = useCallback(() => {
    const scrollMarkId = performanceMonitor.startMark(
      `scroll-${componentName}`,
      'notification-interaction',
      {
        itemCount,
        isVirtualized,
        timestamp: Date.now()
      }
    );
    
    // End the mark after a short delay
    setTimeout(() => {
      performanceMonitor.endMark(scrollMarkId);
    }, 300);
  }, [componentName, itemCount, isVirtualized]);
  
  return {
    trackScrollPerformance,
    logMemoryUsage: (label: string) => logMemoryUsage(`${componentName}-${label}`)
  };
};

export default useListPerformance;
