
/**
 * iOS Push Notification Telemetry
 */
import { performanceReporter } from './performanceAnalytics';
import { browserDetection } from './browserDetection';

interface TelemetryEvent {
  eventType: string;
  timestamp: number;
  isPWA: boolean;
  iosVersion?: string;
  result?: string;
  timings?: {
    start: number;
    end: number;
    duration: number;
  };
  metadata?: Record<string, any>;
  errorCategory?: string; // Added this field
}

interface EventTimer {
  completeEvent: (result: string, metadata?: Record<string, any>) => void;
}

const timings = new Map<string, number>();
const eventBatches: TelemetryEvent[] = [];
const BATCH_SIZE = 10;

export function startEventTiming(eventName: string): EventTimer {
  const id = `${eventName}-${Date.now()}`;
  const startTime = performance.now();
  timings.set(id, startTime);
  
  return {
    completeEvent: (result: string, metadata?: Record<string, any>) => {
      const endTime = performance.now();
      const duration = endTime - (timings.get(id) || startTime);
      
      recordTelemetryEvent({
        eventType: eventName,
        timestamp: Date.now(),
        isPWA: browserDetection.isIOSPWA(),
        iosVersion: browserDetection.getIOSVersion()?.toString(),
        result,
        timings: {
          start: startTime,
          end: endTime,
          duration
        },
        metadata
      });
      
      timings.delete(id);
    }
  };
}

export function recordTelemetryEvent(event: TelemetryEvent): void {
  if (!browserDetection.isIOS()) return;
  
  try {
    eventBatches.push(event);
    
    if (eventBatches.length >= BATCH_SIZE) {
      flushTelemetryBatches();
    }
    
    performanceReporter.reportInteraction(event.eventType, {
      ...event,
      browser: navigator.userAgent,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error recording telemetry:', error);
  }
}

export function flushTelemetryBatches(): void {
  if (eventBatches.length === 0) return;
  
  try {
    // Report batched events
    performanceReporter.reportInteraction('telemetry_batch', {
      events: eventBatches,
      count: eventBatches.length,
      timestamp: Date.now()
    });
    
    // Clear the batch
    eventBatches.length = 0;
  } catch (error) {
    console.error('Error flushing telemetry batches:', error);
  }
}

export function getTelemetryStats() {
  return {
    batchSize: eventBatches.length,
    activeTimings: timings.size,
    lastEvent: eventBatches[eventBatches.length - 1],
    totalEvents: eventBatches.length
  };
}
