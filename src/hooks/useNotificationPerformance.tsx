
import { useCallback, useEffect } from 'react';
import { 
  performanceMonitor, 
  notificationPerformance,
  useComponentPerformance
} from '@/utils/performanceUtils';

/**
 * Hook for measuring notification system performance
 */
export const useNotificationPerformance = (componentName: string) => {
  const componentPerf = useComponentPerformance(componentName);
  
  // Track component render
  useEffect(() => {
    const markId = componentPerf.measureRender();
    
    return () => {
      // End the mark when component unmounts
      performanceMonitor.endMark(markId);
    };
  }, [componentName, componentPerf]);
  
  // Measure a function that loads notifications
  const measureNotificationLoad = useCallback(async <T>(
    name: string,
    loadFn: () => Promise<T>
  ): Promise<T> => {
    return notificationPerformance.measureServiceWorkerOperation(
      `${componentName}-${name}`,
      loadFn,
      { component: componentName }
    );
  }, [componentName]);
  
  // Track notification interaction
  const trackInteraction = useCallback((
    action: string,
    metadata?: Record<string, any>
  ) => {
    const id = notificationPerformance.measureInteraction(action, {
      ...metadata,
      component: componentName
    });
    
    // Return a function to end the measurement
    return () => performanceMonitor.endMark(id);
  }, [componentName]);
  
  return {
    measureNotificationLoad,
    trackInteraction,
    measureOperation: componentPerf.measureOperation,
    getPerformanceData: () => performanceMonitor.getMeasurements()
  };
};

export default useNotificationPerformance;
