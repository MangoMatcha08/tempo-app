
import { useState, useEffect, useRef } from 'react';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { startEventTiming, recordTelemetryEvent } from '@/utils/iosPushTelemetry';
import { createMetadata } from '@/utils/telemetryUtils';
import { performanceMonitor } from '@/utils/performanceUtils';

export interface PerformanceMetrics {
  // Service Worker metrics
  serviceWorkerRegistrationTime?: number; // ms
  serviceWorkerActivationTime?: number;   // ms
  serviceWorkerControllingTime?: number;  // ms

  // Permission metrics
  permissionPromptTime?: number;   // ms
  permissionResponseTime?: number; // ms

  // Token acquisition metrics
  tokenRequestTime?: number;       // ms

  // Overall metrics
  totalSetupTime?: number;         // ms
  batteryImpact?: number;          // CPU intensive time
  
  // iOS specific
  iosVersion?: string;
  deviceIsiOS: boolean;
  deviceIsPWA: boolean;

  // Network metrics
  networkType?: string;
  effectiveConnectionType?: string;
  rtt?: number;
}

// Performance baseline tracking
interface PerformanceBaseline {
  serviceWorkerRegistrationTime: number;
  permissionPromptTime: number;
  permissionResponseTime: number;
  tokenRequestTime: number;
  totalSetupTime: number;
  timestamp: number;
}

export interface PerformanceEvents {
  onServiceWorkerRegistered?: () => void;
  onPermissionRequested?: () => void;
  onPermissionGranted?: () => void;
  onTokenAcquired?: () => void;
  onSetupComplete?: (metrics: PerformanceMetrics) => void;
  onPerformanceDegradation?: (metric: string, current: number, baseline: number) => void;
}

// Local storage key for baseline metrics
const BASELINE_STORAGE_KEY = 'ios-push-performance-baseline';

// Degradation thresholds (percentage increase that triggers alert)
const DEGRADATION_THRESHOLDS: Record<string, number> = {
  serviceWorkerRegistrationTime: 50, // 50% slower
  permissionPromptTime: 30,
  permissionResponseTime: 40,
  tokenRequestTime: 50,
  totalSetupTime: 40
};

/**
 * Hook for monitoring notification setup performance
 * Particularly useful for optimizing iOS performance
 */
export function useNotificationPerformance(events?: PerformanceEvents) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    deviceIsiOS: browserDetection.isIOS(),
    deviceIsPWA: browserDetection.isIOSPWA(),
    iosVersion: String(browserDetection.getIOSVersion() || 'n/a')
  });
  
  const startTimes = useRef<Record<string, number>>({});
  const endTimes = useRef<Record<string, number>>({});
  const setupStartTime = useRef<number>(0);
  
  // Track if setup is in progress
  const [setupInProgress, setSetupInProgress] = useState(false);
  
  // Track performance baselines
  const [baseline, setBaseline] = useState<PerformanceBaseline | null>(null);
  const setupAttemptCount = useRef<number>(0);
  
  // Load baseline metrics on initialization
  useEffect(() => {
    try {
      const storedBaseline = localStorage.getItem(BASELINE_STORAGE_KEY);
      if (storedBaseline) {
        setBaseline(JSON.parse(storedBaseline));
      }
    } catch (error) {
      console.error('Error loading performance baseline:', error);
    }
  }, []);
  
  // Network information detection
  const getNetworkInfo = () => {
    const networkInfo: Pick<PerformanceMetrics, 'networkType' | 'effectiveConnectionType' | 'rtt'> = {
      networkType: 'unknown',
      effectiveConnectionType: 'unknown',
    };
    
    // Use Network Information API if available
    const connection = (navigator as any).connection;
    if (connection) {
      networkInfo.networkType = connection.type || 'unknown';
      networkInfo.effectiveConnectionType = connection.effectiveType || 'unknown';
      networkInfo.rtt = connection.rtt;
    }
    
    return networkInfo;
  };
  
  // Start tracking performance for a specific stage
  const startTracking = (stage: string) => {
    startTimes.current[stage] = performance.now();
    return startTimes.current[stage];
  };
  
  // End tracking performance for a specific stage
  const endTracking = (stage: string) => {
    endTimes.current[stage] = performance.now();
    const duration = endTimes.current[stage] - (startTimes.current[stage] || 0);
    
    // Update metrics for this stage
    setMetrics(prev => ({
      ...prev,
      [stage + 'Time']: duration
    }));
    
    // Check for performance degradation if we have a baseline
    if (baseline && (stage + 'Time') in baseline) {
      const baselineValue = baseline[stage + 'Time' as keyof PerformanceBaseline];
      const threshold = DEGRADATION_THRESHOLDS[stage + 'Time'] || 30;
      
      // Calculate percentage increase
      const percentageIncrease = ((duration - baselineValue) / baselineValue) * 100;
      
      // Alert if degradation beyond threshold
      if (percentageIncrease > threshold) {
        console.warn(`Performance degradation detected: ${stage} is ${percentageIncrease.toFixed(1)}% slower than baseline`);
        events?.onPerformanceDegradation?.(stage + 'Time', duration, baselineValue);
        
        // Record telemetry for degradation
        recordTelemetryEvent({
          eventType: 'performance-degradation',
          isPWA: browserDetection.isIOSPWA(),
          iosVersion: browserDetection.getIOSVersion()?.toString(),
          timestamp: Date.now(),
          result: 'failure',
          metadata: createMetadata('Performance degradation', {
            metric: stage + 'Time',
            currentValue: duration,
            baselineValue,
            percentageIncrease,
            threshold
          })
        });
      }
    }
    
    return duration;
  };
  
  // Calculate and save performance baseline based on recent measurements
  const updatePerformanceBaseline = (currentMetrics: PerformanceMetrics) => {
    // Only update baseline if we have a complete set of metrics
    if (!currentMetrics.totalSetupTime || 
        !currentMetrics.serviceWorkerRegistrationTime ||
        !currentMetrics.permissionPromptTime ||
        !currentMetrics.permissionResponseTime ||
        !currentMetrics.tokenRequestTime) {
      return;
    }
    
    const newBaseline: PerformanceBaseline = {
      serviceWorkerRegistrationTime: currentMetrics.serviceWorkerRegistrationTime,
      permissionPromptTime: currentMetrics.permissionPromptTime,
      permissionResponseTime: currentMetrics.permissionResponseTime,
      tokenRequestTime: currentMetrics.tokenRequestTime,
      totalSetupTime: currentMetrics.totalSetupTime,
      timestamp: Date.now()
    };
    
    // If we have existing baseline, do weighted average to avoid outliers
    // (75% old value, 25% new value) to smooth changes over time
    if (baseline) {
      const weightedBaseline: PerformanceBaseline = {
        ...newBaseline,
        serviceWorkerRegistrationTime: baseline.serviceWorkerRegistrationTime * 0.75 + newBaseline.serviceWorkerRegistrationTime * 0.25,
        permissionPromptTime: baseline.permissionPromptTime * 0.75 + newBaseline.permissionPromptTime * 0.25,
        permissionResponseTime: baseline.permissionResponseTime * 0.75 + newBaseline.permissionResponseTime * 0.25,
        tokenRequestTime: baseline.tokenRequestTime * 0.75 + newBaseline.tokenRequestTime * 0.25,
        totalSetupTime: baseline.totalSetupTime * 0.75 + newBaseline.totalSetupTime * 0.25
      };
      
      setBaseline(weightedBaseline);
      try {
        localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(weightedBaseline));
      } catch (error) {
        console.error('Error saving performance baseline:', error);
      }
    } else {
      // First baseline measurement
      setBaseline(newBaseline);
      try {
        localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(newBaseline));
      } catch (error) {
        console.error('Error saving performance baseline:', error);
      }
    }
  };
  
  // Start tracking the entire setup process
  const startSetupTracking = () => {
    setupStartTime.current = performance.now();
    setSetupInProgress(true);
    setupAttemptCount.current++;
    
    // Add network information to metrics
    setMetrics(prev => ({
      ...prev,
      ...getNetworkInfo()
    }));
    
    // Record telemetry event with enhanced metadata
    const telemetryTimer = startEventTiming('permission-request');
    
    // iOS-specific logging with enhanced context
    if (browserDetection.isIOS()) {
      iosPushLogger.logPerformanceEvent('setup-started', {
        iosVersion: browserDetection.getIOSVersion(),
        isPWA: browserDetection.isIOSPWA(),
        attemptCount: setupAttemptCount.current,
        ...getNetworkInfo()
      });
      
      // Register with performance monitor
      performanceMonitor.startMark('ios-push-setup', 'notification-load', {
        iosVersion: browserDetection.getIOSVersion(),
        isPWA: browserDetection.isIOSPWA(),
        attemptCount: setupAttemptCount.current
      });
    }
    
    return {
      trackServiceWorkerRegistration: () => {
        startTracking('serviceWorkerRegistration');
        return () => {
          const duration = endTracking('serviceWorkerRegistration');
          events?.onServiceWorkerRegistered?.();
          
          // iOS-specific logging with enhanced metadata
          if (browserDetection.isIOS()) {
            iosPushLogger.logPerformanceEvent('sw-registered', { 
              durationMs: duration,
              attemptCount: setupAttemptCount.current
            });
          }
        };
      },
      
      trackPermissionRequest: () => {
        startTracking('permissionPrompt');
        return () => {
          const duration = endTracking('permissionPrompt');
          events?.onPermissionRequested?.();
          
          // iOS-specific logging with enhanced metadata
          if (browserDetection.isIOS()) {
            iosPushLogger.logPerformanceEvent('permission-requested', { 
              durationMs: duration,
              attemptCount: setupAttemptCount.current
            });
          }
        };
      },
      
      trackPermissionResponse: () => {
        startTracking('permissionResponse');
        return () => {
          const duration = endTracking('permissionResponse');
          events?.onPermissionGranted?.();
          
          // iOS-specific logging with enhanced metadata
          if (browserDetection.isIOS()) {
            iosPushLogger.logPerformanceEvent('permission-response', { 
              durationMs: duration,
              permissionState: typeof Notification !== 'undefined' ? Notification.permission : 'unavailable',
              attemptCount: setupAttemptCount.current
            });
          }
        };
      },
      
      trackTokenRequest: () => {
        startTracking('tokenRequest');
        return () => {
          const duration = endTracking('tokenRequest');
          events?.onTokenAcquired?.();
          
          // iOS-specific logging with enhanced metadata
          if (browserDetection.isIOS()) {
            iosPushLogger.logPerformanceEvent('token-acquired', { 
              durationMs: duration,
              attemptCount: setupAttemptCount.current
            });
          }
        };
      },
      
      completeSetup: (success: boolean) => {
        const totalTime = performance.now() - setupStartTime.current;
        
        setMetrics(prev => ({
          ...prev,
          totalSetupTime: totalTime
        }));
        
        setSetupInProgress(false);
        
        // Enhanced metadata for telemetry
        const enhancedMetadata = createMetadata('Setup completed', { 
          totalTimeMs: totalTime,
          success,
          attemptCount: setupAttemptCount.current,
          serviceWorkerRegistrationTime: metrics.serviceWorkerRegistrationTime,
          permissionPromptTime: metrics.permissionPromptTime,
          permissionResponseTime: metrics.permissionResponseTime,
          tokenRequestTime: metrics.tokenRequestTime,
          ...getNetworkInfo()
        });
        
        telemetryTimer.completeEvent(
          success ? 'success' : 'failure',
          enhancedMetadata
        );
        
        // Update performance metrics with additional context
        const updatedMetrics = {
          ...metrics,
          totalSetupTime: totalTime
        };
        
        // iOS-specific logging with enhanced context
        if (browserDetection.isIOS()) {
          iosPushLogger.logPerformanceEvent('setup-completed', {
            success,
            totalTimeMs: totalTime,
            metrics: {
              serviceWorkerRegistration: metrics.serviceWorkerRegistrationTime,
              permissionPrompt: metrics.permissionPromptTime,
              permissionResponse: metrics.permissionResponseTime,
              tokenRequest: metrics.tokenRequestTime
            },
            attemptCount: setupAttemptCount.current
          });
          
          // Complete the performance mark
          performanceMonitor.endMark('ios-push-setup');
        }
        
        // Call the onSetupComplete callback with metrics
        events?.onSetupComplete?.(updatedMetrics);
        
        // Update performance baseline if successful
        if (success) {
          updatePerformanceBaseline(updatedMetrics);
        }
      }
    };
  };
  
  // Measure battery impact during setup
  useEffect(() => {
    if (!setupInProgress) return;
    
    // Clean up resources if component unmounts while setup is in progress
    return () => {
      if (setupInProgress) {
        console.warn('Setup tracking was interrupted by component unmount');
        performanceMonitor.endMark('ios-push-setup');
      }
    };
  }, [setupInProgress]);
  
  // Aggregate metrics for trends
  const getAggregatedMetrics = () => {
    return {
      ...metrics,
      baseline: baseline || undefined,
      attemptCount: setupAttemptCount.current,
      degradationDetected: false // Will be set to true by checks in endTracking
    };
  };
  
  return {
    metrics,
    startSetupTracking,
    isTracking: setupInProgress,
    aggregatedMetrics: getAggregatedMetrics(),
    baseline
  };
}

export default useNotificationPerformance;
