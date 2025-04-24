import { useState, useEffect, useRef } from 'react';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { startEventTiming } from '@/utils/iosPushTelemetry';
import { createMetadata } from '@/utils/telemetryUtils';

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
}

export interface PerformanceEvents {
  onServiceWorkerRegistered?: () => void;
  onPermissionRequested?: () => void;
  onPermissionGranted?: () => void;
  onTokenAcquired?: () => void;
  onSetupComplete?: (metrics: PerformanceMetrics) => void;
}

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
    
    return duration;
  };
  
  // Start tracking the entire setup process
  const startSetupTracking = () => {
    setupStartTime.current = performance.now();
    setSetupInProgress(true);
    
    // Record telemetry event with new EventTimer interface
    const telemetryTimer = startEventTiming('permission-request');
    
    // iOS-specific logging
    if (browserDetection.isIOS()) {
      iosPushLogger.logPerformanceEvent('setup-started', {
        iosVersion: browserDetection.getIOSVersion(),
        isPWA: browserDetection.isIOSPWA()
      });
    }
    
    return {
      trackServiceWorkerRegistration: () => {
        startTracking('serviceWorkerRegistration');
        return () => {
          const duration = endTracking('serviceWorkerRegistration');
          events?.onServiceWorkerRegistered?.();
          
          // iOS-specific logging
          if (browserDetection.isIOS()) {
            iosPushLogger.logPerformanceEvent('sw-registered', { 
              durationMs: duration 
            });
          }
        };
      },
      
      trackPermissionRequest: () => {
        startTracking('permissionPrompt');
        return () => {
          const duration = endTracking('permissionPrompt');
          events?.onPermissionRequested?.();
          
          // iOS-specific logging
          if (browserDetection.isIOS()) {
            iosPushLogger.logPerformanceEvent('permission-requested', { 
              durationMs: duration 
            });
          }
        };
      },
      
      trackPermissionResponse: () => {
        startTracking('permissionResponse');
        return () => {
          const duration = endTracking('permissionResponse');
          events?.onPermissionGranted?.();
          
          // iOS-specific logging
          if (browserDetection.isIOS()) {
            iosPushLogger.logPerformanceEvent('permission-response', { 
              durationMs: duration 
            });
          }
        };
      },
      
      trackTokenRequest: () => {
        startTracking('tokenRequest');
        return () => {
          const duration = endTracking('tokenRequest');
          events?.onTokenAcquired?.();
          
          // iOS-specific logging
          if (browserDetection.isIOS()) {
            iosPushLogger.logPerformanceEvent('token-acquired', { 
              durationMs: duration 
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
        
        telemetryTimer.completeEvent(
          success ? 'success' : 'failure',
          createMetadata('Setup completed', { totalTimeMs: totalTime })
        );
        
        // iOS-specific logging
        if (browserDetection.isIOS()) {
          iosPushLogger.logPerformanceEvent('setup-completed', {
            success,
            totalTimeMs: totalTime,
            metrics: {
              serviceWorkerRegistration: metrics.serviceWorkerRegistrationTime,
              permissionPrompt: metrics.permissionPromptTime,
              permissionResponse: metrics.permissionResponseTime,
              tokenRequest: metrics.tokenRequestTime
            }
          });
        }
        
        // Call the onSetupComplete callback with metrics
        events?.onSetupComplete?.(metrics);
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
      }
    };
  }, [setupInProgress]);
  
  return {
    metrics,
    startSetupTracking,
    isTracking: setupInProgress
  };
}

export default useNotificationPerformance;
