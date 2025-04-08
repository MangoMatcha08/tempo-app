
// This file is a utility for monitoring performance in the application

export type OperationCategory = 
  | 'reminders' 
  | 'notifications' 
  | 'pagination' 
  | 'auth' 
  | 'network'
  | 'firestore'
  | 'cache';

interface PerformanceMark {
  id: string;
  category: OperationCategory;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private marks: Record<string, PerformanceMark> = {};
  private enabled = process.env.NODE_ENV === 'development' || 
    window.location.hostname.includes('localhost');

  startMark(id: string, category: OperationCategory, metadata?: Record<string, any>) {
    if (!this.enabled) return;
    
    this.marks[id] = {
      id,
      category,
      startTime: performance.now(),
      metadata
    };
    
    console.debug(`[Performance] Started mark: ${id} (${category})`);
    return id;
  }

  endMark(id: string, additionalMetadata?: Record<string, any>) {
    if (!this.enabled || !this.marks[id]) return;
    
    const mark = this.marks[id];
    mark.endTime = performance.now();
    mark.duration = mark.endTime - mark.startTime;
    
    if (additionalMetadata) {
      mark.metadata = { ...mark.metadata, ...additionalMetadata };
    }
    
    console.debug(`[Performance] Ended mark: ${id} (${mark.category}) - Duration: ${mark.duration.toFixed(2)}ms`);
    
    // Report metrics to monitoring service if in production
    if (process.env.NODE_ENV === 'production' && mark.duration > 1000) {
      this.reportLongOperation(mark);
    }
    
    return mark;
  }
  
  private reportLongOperation(mark: PerformanceMark) {
    // In a real app, this would send telemetry to a service
    console.warn(`[Performance] Long operation detected: ${mark.id} (${mark.category}) - Duration: ${mark.duration.toFixed(2)}ms`);
  }
}

export const performanceMonitor = new PerformanceMonitor();

