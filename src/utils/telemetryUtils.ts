
import { TimingMetadata, PerformanceAggregation } from '../types/telemetry/telemetryTypes';

/**
 * Create properly typed metadata for telemetry events
 */
export function createMetadata(contextInfo?: string, additionalData?: Record<string, unknown>): TimingMetadata {
  return {
    context: contextInfo,
    data: additionalData
  };
}

/**
 * Validate metadata structure at runtime
 */
export function validateMetadata(metadata: unknown): metadata is TimingMetadata {
  if (!metadata || typeof metadata !== 'object') return false;
  
  const cast = metadata as TimingMetadata;
  
  // Context must be undefined or string
  if (cast.context !== undefined && typeof cast.context !== 'string') return false;
  
  // Data must be undefined or object
  if (cast.data !== undefined && (typeof cast.data !== 'object' || cast.data === null)) return false;
  
  return true;
}

/**
 * Calculate percentile from an array of numbers
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  
  // Sort the values
  const sorted = [...values].sort((a, b) => a - b);
  
  // Calculate the index
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  
  return sorted[index];
}

/**
 * Aggregate performance metrics from a collection of measurements
 */
export function aggregatePerformanceMetrics(
  measurements: number[], 
  previousAggregation?: PerformanceAggregation
): PerformanceAggregation {
  if (measurements.length === 0) {
    return { count: 0 };
  }
  
  // Calculate statistics
  const sum = measurements.reduce((acc, val) => acc + val, 0);
  const mean = sum / measurements.length;
  const min = Math.min(...measurements);
  const max = Math.max(...measurements);
  
  // Calculate percentiles
  const p50 = calculatePercentile(measurements, 50);
  const p90 = calculatePercentile(measurements, 90);
  const p95 = calculatePercentile(measurements, 95);
  
  // Determine trend if we have previous aggregation
  let trend: 'improving' | 'stable' | 'degrading' | undefined;
  
  if (previousAggregation && previousAggregation.mean !== undefined) {
    const percentChange = ((mean - previousAggregation.mean) / previousAggregation.mean) * 100;
    
    if (percentChange < -5) {
      trend = 'improving'; // At least 5% faster
    } else if (percentChange > 10) {
      trend = 'degrading'; // At least 10% slower
    } else {
      trend = 'stable';
    }
  }
  
  return {
    p50,
    p90,
    p95,
    mean,
    min,
    max,
    count: measurements.length,
    trend
  };
}
