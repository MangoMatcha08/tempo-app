
/**
 * iOS Push Notification Telemetry
 * 
 * Anonymous error reporting and success tracking for iOS push notifications
 * to identify common patterns and improve the permission flow.
 */

import { browserDetection } from './browserDetection';
import { IOSPushErrorCategory } from './iosErrorHandler';

/**
 * Structure for telemetry events
 */
export interface TelemetryEvent {
  eventType: 'permission-request' | 'sw-registration' | 'token-acquisition' | 'error' | 'recovery-action' | 'pwa-install' | 'status-check';
  iosVersion?: string;
  isPWA: boolean;
  timestamp: number;
  result: 'success' | 'failure' | 'started' | 'progress';
  errorCategory?: IOSPushErrorCategory;
  timings?: {
    start: number;
    end: number;
    duration: number;
  };
  metadata?: Record<string, any>;
}

// Configuration for telemetry batching
const BATCH_SIZE = 10;
const MAX_BATCH_AGE_MS = 30000; // 30 seconds
const BATCH_STORAGE_KEY = 'ios-push-telemetry-batch';
const QUEUE_STORAGE_KEY = 'ios-push-telemetry-queue';

// Batch processing state
let batchTimer: number | null = null;
let isProcessingBatch = false;

/**
 * Record a telemetry event
 */
export const recordTelemetryEvent = async (event: TelemetryEvent): Promise<void> => {
  try {
    // Add device context
    const enrichedEvent = {
      ...event,
      deviceContext: {
        iosVersion: browserDetection.getIOSVersion(),
        userAgent: navigator.userAgent,
        isStandalone: (navigator as any).standalone === true,
      }
    };
    
    // Store locally first in event history
    const events = JSON.parse(localStorage.getItem('ios-push-telemetry') || '[]');
    events.push(enrichedEvent);
    localStorage.setItem('ios-push-telemetry', JSON.stringify(events.slice(-50))); // Keep last 50
    
    // Add to batch queue
    addEventToBatchQueue(enrichedEvent);
  } catch (e) {
    // Silent fail for telemetry
    console.debug('Failed to record telemetry', e);
  }
};

/**
 * Add an event to the batch queue
 */
const addEventToBatchQueue = (event: any): void => {
  try {
    // Get current queue
    const queue = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
    queue.push(event);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    
    // Schedule batch processing if not already scheduled
    scheduleBatchProcessing();
  } catch (e) {
    console.debug('Failed to add event to batch queue', e);
  }
};

/**
 * Schedule batch processing
 */
const scheduleBatchProcessing = (): void => {
  // Clear any existing timer
  if (batchTimer !== null) {
    window.clearTimeout(batchTimer);
  }
  
  // Schedule batch processing
  batchTimer = window.setTimeout(() => {
    processBatch();
  }, MAX_BATCH_AGE_MS);
  
  // Also process immediately if queue is large enough
  const queue = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
  if (queue.length >= BATCH_SIZE) {
    processBatch();
  }
};

/**
 * Process the current batch of events
 */
const processBatch = async (): Promise<void> => {
  // Prevent concurrent processing
  if (isProcessingBatch) return;
  
  try {
    isProcessingBatch = true;
    
    // Clear timer
    if (batchTimer !== null) {
      window.clearTimeout(batchTimer);
      batchTimer = null;
    }
    
    // Get current queue and reset it
    const queue = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
    if (queue.length === 0) {
      isProcessingBatch = false;
      return;
    }
    
    // Clear queue immediately to prevent data loss on error
    localStorage.setItem(QUEUE_STORAGE_KEY, '[]');
    
    // Merge with any failed batches
    const failedBatch = JSON.parse(localStorage.getItem(BATCH_STORAGE_KEY) || '[]');
    const batchToProcess = [...failedBatch, ...queue];
    
    // Clear failed batch storage
    localStorage.setItem(BATCH_STORAGE_KEY, '[]');
    
    // Optional: Send to analytics endpoint if available
    if (process.env.ENABLE_PUSH_ANALYTICS === 'true') {
      try {
        await fetch('/api/push-analytics-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: batchToProcess }),
          keepalive: true // Allow request to complete even if page unloads
        });
      } catch (error) {
        console.debug('Failed to send telemetry batch, storing for retry', error);
        // Store failed batch for retry
        localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batchToProcess));
      }
    }
  } catch (e) {
    console.debug('Failed to process telemetry batch', e);
  } finally {
    isProcessingBatch = false;
  }
};

/**
 * Start timing a telemetry event
 */
export const startEventTiming = (eventType: TelemetryEvent['eventType']): { 
  startTime: number, 
  completeEvent: (result: 'success' | 'failure', metadata?: Record<string, any>) => Promise<void> 
} => {
  const startTime = performance.now();
  
  return {
    startTime,
    completeEvent: async (result: 'success' | 'failure', metadata?: Record<string, any>) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      await recordTelemetryEvent({
        eventType,
        isPWA: browserDetection.isIOSPWA(),
        iosVersion: browserDetection.getIOSVersion()?.toString(),
        timestamp: Date.now(),
        result,
        timings: {
          start: startTime,
          end: endTime,
          duration
        },
        metadata
      });
    }
  };
};

/**
 * Get statistics from collected telemetry
 */
export const getTelemetryStats = (): { 
  totalEvents: number,
  successRate: number,
  averageDuration: number,
  errorBreakdown: Record<string, number>,
  recentEvents: TelemetryEvent[],
  pendingEvents: number
} => {
  try {
    const events = JSON.parse(localStorage.getItem('ios-push-telemetry') || '[]') as TelemetryEvent[];
    const pendingQueue = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
    const pendingBatch = JSON.parse(localStorage.getItem(BATCH_STORAGE_KEY) || '[]');
    
    // Success rate calculation
    const totalEvents = events.length;
    const successfulEvents = events.filter(e => e.result === 'success').length;
    const successRate = totalEvents > 0 ? successfulEvents / totalEvents : 0;
    
    // Average duration
    let totalDuration = 0;
    let eventsWithDuration = 0;
    
    events.forEach(event => {
      if (event.timings?.duration) {
        totalDuration += event.timings.duration;
        eventsWithDuration++;
      }
    });
    
    const averageDuration = eventsWithDuration > 0 ? totalDuration / eventsWithDuration : 0;
    
    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    events
      .filter(e => e.result === 'failure' && e.errorCategory)
      .forEach(event => {
        const category = event.errorCategory as string;
        errorBreakdown[category] = (errorBreakdown[category] || 0) + 1;
      });
    
    return {
      totalEvents,
      successRate,
      averageDuration,
      errorBreakdown,
      recentEvents: events.slice(-10), // Last 10 events
      pendingEvents: pendingQueue.length + pendingBatch.length
    };
  } catch (e) {
    console.debug('Failed to get telemetry stats', e);
    return {
      totalEvents: 0,
      successRate: 0,
      averageDuration: 0,
      errorBreakdown: {},
      recentEvents: [],
      pendingEvents: 0
    };
  }
};

/**
 * Force process any pending batches
 * Useful for ensuring data is sent before page unload
 */
export const flushTelemetryBatches = async (): Promise<boolean> => {
  try {
    await processBatch();
    return true;
  } catch (e) {
    console.debug('Failed to flush telemetry batches', e);
    return false;
  }
};

/**
 * Clear collected telemetry data
 */
export const clearTelemetryData = (): void => {
  localStorage.removeItem('ios-push-telemetry');
  localStorage.removeItem(QUEUE_STORAGE_KEY);
  localStorage.removeItem(BATCH_STORAGE_KEY);
};

// Set up event listeners for page lifecycle events
if (typeof window !== 'undefined') {
  // Try to send batches when page is hidden or before unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      processBatch();
    }
  });
  
  window.addEventListener('beforeunload', () => {
    processBatch();
  });
  
  // Process any pending batches on page load
  if (document.readyState === 'complete') {
    scheduleBatchProcessing();
  } else {
    window.addEventListener('load', () => {
      scheduleBatchProcessing();
    });
  }
}
