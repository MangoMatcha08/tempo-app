
import { TimingMetadata } from '../types/telemetry/telemetryTypes';

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
