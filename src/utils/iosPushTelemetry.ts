/**
 * iOS Push Notification Telemetry
 * 
 * Advanced telemetry for iOS push notification flow
 */

import { TelemetryEvent, EventTimer, TimingMetadata } from '@/types/telemetry/telemetryTypes';
import { createMetadata } from '@/utils/telemetryUtils';
import { browserDetection } from '@/utils/browserDetection';
import { iosPwaDetection } from '@/utils/iosPwaDetection';

// Local storage key for storing telemetry events
const TELEMETRY_STORAGE_KEY = 'ios-push-telemetry-events';

// Maximum number of events to store
const MAX_EVENTS = 100;

/**
 * Enhanced event timer with additional data capabilities
 */
class EnhancedEventTimer implements EventTimer {
  private readonly startTime: number;
  private readonly eventType: string;
  private additionalData: Record<string, any>;

  constructor(eventType: string) {
    this.startTime = performance.now();
    this.eventType = eventType;
    this.additionalData = {};
  }

  /**
   * Add data to the timer for later inclusion in the event
   */
  public addData(data: Record<string, any>): void {
    this.additionalData = { ...this.additionalData, ...data };
  }

  /**
   * Get the start time of this timer
   */
  public getStartTime(): number {
    return this.startTime;
  }

  /**
   * Complete the timed event and record telemetry
   */
  completeEvent(result: 'success' | 'failure' | 'error', metadata?: TimingMetadata): void {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    // Merge provided metadata with additional data
    const mergedMetadata = metadata ? { ...metadata } : createMetadata();
    if (mergedMetadata.data) {
      mergedMetadata.data = { ...mergedMetadata.data, ...this.additionalData };
    } else {
      mergedMetadata.data = this.additionalData;
    }
    
    // Add timing information to metadata
    if (mergedMetadata.data) {
      mergedMetadata.data.totalTimeMs = duration;
    }

    // Record the completed event
    recordTelemetryEvent({
      eventType: this.eventType,
      isPWA: iosPwaDetection.isRunningAsPwa(),
      iosVersion: browserDetection.getIOSVersion()?.toString(),
      timestamp: Date.now(),
      result,
      timings: {
        start: this.startTime,
        end: endTime,
        duration
      },
      metadata: mergedMetadata
    });
  }
}

/**
 * Start timing an event for telemetry
 * @param eventType Type of event to time
 * @returns Timer object with completeEvent method
 */
export function startEventTiming(eventType: string): EnhancedEventTimer {
  return new EnhancedEventTimer(eventType);
}

/**
 * Record a telemetry event
 * @param event Telemetry event to record
 */
export function recordTelemetryEvent(event: TelemetryEvent): void {
  // Only record events on iOS devices
  if (!browserDetection.isIOS()) return;

  try {
    // Get existing events from storage
    const eventsJson = localStorage.getItem(TELEMETRY_STORAGE_KEY) || '[]';
    const events = JSON.parse(eventsJson) as TelemetryEvent[];
    
    // Add new event
    events.push(event);
    
    // Keep only the most recent events
    const trimmedEvents = events.slice(-MAX_EVENTS);
    
    // Save back to storage
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(trimmedEvents));
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Telemetry]', event.eventType, event);
    }
  } catch (error) {
    // Fail silently - telemetry should never break the application
    console.error('Failed to record telemetry event:', error);
  }
}

/**
 * Get all recorded telemetry events
 * @returns Array of recorded telemetry events
 */
export function getTelemetryEvents(): TelemetryEvent[] {
  try {
    const eventsJson = localStorage.getItem(TELEMETRY_STORAGE_KEY) || '[]';
    return JSON.parse(eventsJson) as TelemetryEvent[];
  } catch (error) {
    console.error('Failed to retrieve telemetry events:', error);
    return [];
  }
}

/**
 * Clear all recorded telemetry events
 */
export function clearTelemetryEvents(): void {
  localStorage.removeItem(TELEMETRY_STORAGE_KEY);
}

/**
 * Get telemetry statistics for iOS push notifications
 */
export function getTelemetryStats() {
  try {
    const events = getTelemetryEvents();
    const successfulEvents = events.filter(e => e.result === 'success');
    
    // Calculate error breakdown
    const errorBreakdown = events.reduce((acc, event) => {
      const errorType = event.metadata?.data?.errorType;
      if (event.result === 'error' && typeof errorType === 'string') {
        acc[errorType] = (acc[errorType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate average duration
    const durations = events
      .filter(e => e.timings?.duration)
      .map(e => e.timings!.duration);
    const averageDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // Get recent events (last 5)
    const recentEvents = events.slice(-5);

    // Count pending events (those without a result)
    const pendingEvents = events.filter(e => !e.result).length;

    // Performance metrics calculation
    const performanceMetrics = events.reduce((acc, event) => {
      if (event.timings?.duration) {
        const metricName = event.eventType;
        if (!acc[metricName]) {
          acc[metricName] = {
            p50: event.timings.duration,
            mean: event.timings.duration,
            trend: 'stable'
          };
        }
      }
      return acc;
    }, {} as Record<string, { p50?: number; mean?: number; trend?: 'improving' | 'stable' | 'degrading' }>);

    return {
      totalEvents: events.length,
      successRate: successfulEvents.length / events.length,
      averageDuration,
      errorBreakdown,
      recentEvents,
      pendingEvents,
      performanceMetrics
    };
  } catch (error) {
    console.error('Failed to get telemetry stats:', error);
    return null;
  }
}

/**
 * Flush telemetry batches to storage
 */
export function flushTelemetryBatches() {
  try {
    const events = getTelemetryEvents();
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to flush telemetry batches:', error);
  }
}
