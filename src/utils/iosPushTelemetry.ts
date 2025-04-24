
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
  errorCategory?: string;
}

interface EventTimer {
  completeEvent: (result: string, metadata?: Record<string, any>) => void;
}

const timings = new Map<string, number>();
const eventBatches: TelemetryEvent[] = [];
const BATCH_SIZE = 10;

// Utility function to calculate success rate
function calculateSuccessRate(events: TelemetryEvent[]): number {
  if (events.length === 0) return 0;
  const successfulEvents = events.filter(event => event.result === 'success').length;
  return successfulEvents / events.length;
}

// Utility function to calculate average duration
function calculateAverageDuration(events: TelemetryEvent[]): number {
  const eventsWithDuration = events.filter(event => event.timings?.duration);
  if (eventsWithDuration.length === 0) return 0;
  
  const totalDuration = eventsWithDuration.reduce((sum, event) => 
    sum + (event.timings?.duration || 0), 0);
  return totalDuration / eventsWithDuration.length;
}

// Utility function to categorize errors
function categorizeErrors(events: TelemetryEvent[]): Record<string, number> {
  const errorCounts: Record<string, number> = {};
  events
    .filter(event => event.result === 'failure')
    .forEach(event => {
      const category = event.errorCategory || 'unknown';
      errorCounts[category] = (errorCounts[category] || 0) + 1;
    });
  return errorCounts;
}

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
    performanceReporter.reportInteraction('telemetry_batch', {
      events: eventBatches,
      count: eventBatches.length,
      timestamp: Date.now()
    });
    
    eventBatches.length = 0;
  } catch (error) {
    console.error('Error flushing telemetry batches:', error);
  }
}

export function getTelemetryStats() {
  const recentEventsCount = 10; // Show last 10 events
  
  return {
    totalEvents: eventBatches.length,
    successRate: calculateSuccessRate(eventBatches),
    averageDuration: calculateAverageDuration(eventBatches),
    errorBreakdown: categorizeErrors(eventBatches),
    recentEvents: eventBatches.slice(-recentEventsCount),
    pendingEvents: timings.size,
    batchSize: eventBatches.length,
    activeTimings: timings.size,
    lastEvent: eventBatches[eventBatches.length - 1]
  };
}
