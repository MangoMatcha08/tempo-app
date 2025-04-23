
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
}

const timings = new Map<string, number>();

export function startEventTiming(eventName: string): string {
  const id = `${eventName}-${Date.now()}`;
  timings.set(id, performance.now());
  return id;
}

export function endEventTiming(id: string): number | null {
  const startTime = timings.get(id);
  if (!startTime) return null;
  
  const duration = performance.now() - startTime;
  timings.delete(id);
  return duration;
}

export function recordTelemetryEvent(event: TelemetryEvent): void {
  if (!browserDetection.isIOS()) return;
  
  try {
    performanceReporter.reportInteraction(event.eventType, {
      ...event,
      browser: navigator.userAgent,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error recording telemetry:', error);
  }
}
