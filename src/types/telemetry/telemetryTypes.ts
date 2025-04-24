
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
  data?: {
    iosVersion?: string;
    step?: number;
    error?: string;
    errorMessage?: string;
    errorCategory?: string;
    actionLabel?: string;
    overallStatus?: string;
    platform?: string;
    token?: string;
    granted?: boolean;
    permissionGranted?: boolean;
    serviceWorkerRegistered?: boolean;
    implementation?: string;
    
    // Performance metrics
    totalTimeMs?: number;
    attemptCount?: number;
    serviceWorkerRegistrationTime?: number;
    permissionPromptTime?: number;
    permissionResponseTime?: number;
    tokenRequestTime?: number;
    
    // Regression detection
    metricName?: string;
    currentValue?: number;
    baselineValue?: number;
    percentageIncrease?: number;
    threshold?: number;
    
    // Network info
    networkType?: string;
    effectiveConnectionType?: string;
    rtt?: number;
  };
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
  | 'performance-degradation'
  | 'unknown';

/**
 * Performance metrics aggregation
 */
export interface PerformanceAggregation {
  p50?: number;  // 50th percentile (median)
  p90?: number;  // 90th percentile
  p95?: number;  // 95th percentile
  mean?: number;  // Average value
  min?: number;   // Minimum value
  max?: number;   // Maximum value
  count: number;  // Number of measurements
  trend?: 'improving' | 'stable' | 'degrading';
}

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
  
  // Performance metrics aggregation
  performanceMetrics?: {
    [metricName: string]: PerformanceAggregation;
  };
}
