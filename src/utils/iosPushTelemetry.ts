
/**
 * iOS Push Notification Telemetry
 */
import { performanceReporter } from './performanceAnalytics';
import { browserDetection } from './browserDetection';
import { 
  EventTimer, 
  TelemetryEvent, 
  TimingMetadata, 
  TelemetryErrorCategory,
  PerformanceAggregation
} from '../types/telemetry/telemetryTypes';
import { createMetadata, validateMetadata, aggregatePerformanceMetrics } from './telemetryUtils';

// Validation constants
const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUIRED_FIELDS: (keyof TelemetryEvent)[] = ['eventType', 'timestamp', 'isPWA'];

// Performance metrics storage
interface MetricEntry {
  value: number;
  timestamp: number;
}

// Store the last 50 measurements for each metric
const metricHistory: Record<string, MetricEntry[]> = {};
const MAX_METRIC_HISTORY = 50;

// Performance aggregations
const metricAggregations: Record<string, PerformanceAggregation> = {};

function validateEvent(event: TelemetryEvent): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields check
  REQUIRED_FIELDS.forEach(field => {
    if (event[field] === undefined || event[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Timestamp validation
  const now = Date.now();
  if (event.timestamp > now || event.timestamp < now - MAX_EVENT_AGE_MS) {
    errors.push('Invalid timestamp');
  }

  // Timings validation if present
  if (event.timings) {
    if (event.timings.end < event.timings.start) {
      errors.push('Invalid timing: end before start');
    }
    if (event.timings.duration !== event.timings.end - event.timings.start) {
      errors.push('Invalid timing: duration mismatch');
    }
  }

  // Event type validation
  if (typeof event.eventType !== 'string' || event.eventType.trim() === '') {
    errors.push('Invalid event type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function sanitizeEvent(event: TelemetryEvent): TelemetryEvent {
  const sanitized = { ...event };

  // Ensure timestamp is a number
  sanitized.timestamp = Number(sanitized.timestamp) || Date.now();

  // Trim string fields
  if (typeof sanitized.eventType === 'string') {
    sanitized.eventType = sanitized.eventType.trim();
  }
  if (typeof sanitized.iosVersion === 'string') {
    sanitized.iosVersion = sanitized.iosVersion.trim();
  }

  // Ensure metadata is an object
  if (sanitized.metadata && typeof sanitized.metadata !== 'object') {
    sanitized.metadata = {};
  }

  // Add event ID for deduplication
  sanitized.eventId = `${sanitized.eventType}-${sanitized.timestamp}-${Math.random().toString(36).substr(2, 9)}`;

  return sanitized;
}

const timings = new Map<string, number>();
const eventBatches: TelemetryEvent[] = [];
const BATCH_SIZE = 10;
const processedEventIds = new Set<string>();

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

// Add a new performance measurement to history
function recordMetricMeasurement(metricName: string, value: number): void {
  if (!metricHistory[metricName]) {
    metricHistory[metricName] = [];
  }
  
  metricHistory[metricName].push({
    value,
    timestamp: Date.now()
  });
  
  // Limit history size
  if (metricHistory[metricName].length > MAX_METRIC_HISTORY) {
    metricHistory[metricName] = metricHistory[metricName].slice(-MAX_METRIC_HISTORY);
  }
  
  // Update aggregation
  updateMetricAggregation(metricName);
}

// Update the aggregated metrics for a specific metric
function updateMetricAggregation(metricName: string): void {
  if (!metricHistory[metricName] || metricHistory[metricName].length === 0) {
    return;
  }
  
  const values = metricHistory[metricName].map(entry => entry.value);
  
  // Update aggregation with previous values for trend detection
  metricAggregations[metricName] = aggregatePerformanceMetrics(
    values, 
    metricAggregations[metricName]
  );
}

// Get rolling window of measurements (e.g. last 24 hours)
function getRollingWindowMeasurements(metricName: string, windowMs: number = 24 * 60 * 60 * 1000): number[] {
  if (!metricHistory[metricName]) {
    return [];
  }
  
  const now = Date.now();
  const cutoff = now - windowMs;
  
  return metricHistory[metricName]
    .filter(entry => entry.timestamp >= cutoff)
    .map(entry => entry.value);
}

export function startEventTiming(eventName: string): EventTimer {
  const id = `${eventName}-${Date.now()}`;
  const startTime = performance.now();
  timings.set(id, startTime);
  
  return {
    completeEvent: (result: 'success' | 'failure' | 'error', metadata?: TimingMetadata) => {
      const endTime = performance.now();
      const duration = endTime - (timings.get(id) || startTime);
      
      // Record performance metric for timing events
      recordMetricMeasurement(`${eventName}`, duration);
      
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
        metadata: validateMetadata(metadata) ? metadata : undefined,
        performanceMetrics: {
          [eventName]: metricAggregations[eventName]
        }
      });
      
      timings.delete(id);
    }
  };
}

export function recordTelemetryEvent(event: TelemetryEvent): void {
  if (!browserDetection.isIOS()) return;
  
  try {
    // Sanitize and validate the event
    const sanitizedEvent = sanitizeEvent(event);
    const validation = validateEvent(sanitizedEvent);
    
    // Add validation status to event
    sanitizedEvent.validationStatus = validation.isValid ? 'valid' : 'invalid';
    
    // Check for duplicate events
    if (sanitizedEvent.eventId && processedEventIds.has(sanitizedEvent.eventId)) {
      console.warn('Duplicate event detected:', sanitizedEvent.eventType);
      return;
    }
    
    // Only process valid events
    if (validation.isValid) {
      // Record performance metrics if timing data is present
      if (sanitizedEvent.timings?.duration) {
        recordMetricMeasurement(
          `${sanitizedEvent.eventType}`, 
          sanitizedEvent.timings.duration
        );
        
        // Add performance metrics to the event
        sanitizedEvent.performanceMetrics = {
          [sanitizedEvent.eventType]: metricAggregations[sanitizedEvent.eventType]
        };
      }
      
      eventBatches.push(sanitizedEvent);
      
      if (sanitizedEvent.eventId) {
        processedEventIds.add(sanitizedEvent.eventId);
      }
      
      if (eventBatches.length >= BATCH_SIZE) {
        flushTelemetryBatches();
      }
      
      performanceReporter.reportInteraction(sanitizedEvent.eventType, {
        ...sanitizedEvent,
        browser: navigator.userAgent,
        validationErrors: [],
      });
    } else {
      console.warn('Invalid telemetry event:', validation.errors);
      performanceReporter.reportInteraction('invalid_telemetry', {
        event: sanitizedEvent,
        validationErrors: validation.errors,
      });
    }
  } catch (error) {
    console.error('Error recording telemetry:', error);
  }
}

export function flushTelemetryBatches(): void {
  if (eventBatches.length === 0) return;
  
  try {
    const validEvents = eventBatches.filter(event => event.validationStatus === 'valid');
    
    if (validEvents.length > 0) {
      performanceReporter.reportInteraction('telemetry_batch', {
        events: validEvents,
        count: validEvents.length,
        timestamp: Date.now(),
        totalEventsProcessed: processedEventIds.size,
        performanceMetricsSummary: metricAggregations
      });
    }
    
    // Clear processed events older than 24 hours
    const cutoff = Date.now() - MAX_EVENT_AGE_MS;
    eventBatches.forEach(event => {
      if (event.eventId && event.timestamp < cutoff) {
        processedEventIds.delete(event.eventId);
      }
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
    lastEvent: eventBatches[eventBatches.length - 1],
    performanceMetrics: metricAggregations
  };
}

// Get performance metrics for a specific metric name over a time window
export function getPerformanceMetricsForPeriod(metricName: string, periodMs: number = 24 * 60 * 60 * 1000): PerformanceAggregation {
  const values = getRollingWindowMeasurements(metricName, periodMs);
  return aggregatePerformanceMetrics(values);
}

// Export all performance metrics
export function getAllPerformanceMetrics(): Record<string, PerformanceAggregation> {
  return { ...metricAggregations };
}

