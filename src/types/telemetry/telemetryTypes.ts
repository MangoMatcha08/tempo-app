
/**
 * Telemetry type definitions for iOS push notification system
 */

/**
 * Metadata for timing operations
 */
export interface TimingMetadata {
  /** Custom context about the operation */
  context?: string;
  /** Additional data relevant to the timing */
  data?: Record<string, unknown>;
}

/**
 * Timer interface for measuring operation durations
 */
export interface EventTimer {
  /** Complete a timed event with result and optional metadata */
  completeEvent: (result: 'success' | 'failure' | 'error', metadata?: TimingMetadata) => void;
}

/**
 * Valid categories for errors in telemetry events
 */
export type TelemetryErrorCategory = 
  | 'permission-denied'
  | 'network-error'
  | 'timeout'
  | 'validation-error'
  | 'unknown';

/**
 * Core telemetry event structure
 */
export interface TelemetryEvent {
  eventType: string;
  timestamp: number;
  isPWA: boolean;
  iosVersion?: string;
  result?: 'success' | 'failure' | 'error';
  timings?: {
    start: number;
    end: number;
    duration: number;
  };
  metadata?: TimingMetadata;
  errorCategory?: TelemetryErrorCategory;
  validationStatus?: 'valid' | 'invalid';
  eventId?: string;
}

