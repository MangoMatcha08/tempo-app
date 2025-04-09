
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
    
    // Store locally first
    const events = JSON.parse(localStorage.getItem('ios-push-telemetry') || '[]');
    events.push(enrichedEvent);
    localStorage.setItem('ios-push-telemetry', JSON.stringify(events.slice(-50))); // Keep last 50
    
    // Optional: Send to analytics endpoint if available
    if (process.env.ENABLE_PUSH_ANALYTICS === 'true') {
      await fetch('/api/push-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: enrichedEvent }),
        keepalive: true // Allow request to complete even if page unloads
      });
    }
  } catch (e) {
    // Silent fail for telemetry
    console.debug('Failed to record telemetry', e);
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
  recentEvents: TelemetryEvent[]
} => {
  try {
    const events = JSON.parse(localStorage.getItem('ios-push-telemetry') || '[]') as TelemetryEvent[];
    
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
      recentEvents: events.slice(-10) // Last 10 events
    };
  } catch (e) {
    console.debug('Failed to get telemetry stats', e);
    return {
      totalEvents: 0,
      successRate: 0,
      averageDuration: 0,
      errorBreakdown: {},
      recentEvents: []
    };
  }
};

/**
 * Clear collected telemetry data
 */
export const clearTelemetryData = (): void => {
  localStorage.removeItem('ios-push-telemetry');
};
