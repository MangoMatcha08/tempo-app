
/**
 * Core telemetry type definitions
 */

export interface TimingMetadata {
  timestamp: number;
  duration?: number;
  start?: number;
  end?: number;
  category: string;
  result: 'success' | 'failure' | 'error';
  error?: ErrorMetadata;
}

export interface ErrorMetadata {
  message: string;
  code?: string;
  category?: string;
  recoverable?: boolean;
  metadata?: Record<string, any>;
}

export interface TelemetryEvent {
  eventType: string;
  timestamp: number;
  timings?: TimingMetadata;
  metadata?: Record<string, any>;
  result?: string;
  error?: ErrorMetadata;
}

