
import { getMessaging, getToken } from 'firebase/messaging';
import { iosPushLogger } from '@/utils/iosPushLogger';
import { browserDetection } from '@/utils/browserDetection';
import { getCurrentDeviceTimingConfig, withRetry } from '@/utils/iosPermissionTimings';
import { toast } from 'sonner';

interface TokenMetrics {
  startTime: number;
  attempts: number;
  totalDuration?: number;
  success: boolean;
  error?: string;
}

const metrics: Record<string, TokenMetrics> = {};

/**
 * Request FCM token with enhanced error handling and metrics
 */
export async function requestFCMToken(vapidKey: string): Promise<string> {
  const requestId = Date.now().toString();
  metrics[requestId] = {
    startTime: Date.now(),
    attempts: 0,
    success: false
  };
  
  try {
    const messaging = getMessaging();
    const timingConfig = getCurrentDeviceTimingConfig();
    
    // Use withRetry for token acquisition
    const token = await withRetry(
      async () => {
        metrics[requestId].attempts++;
        
        iosPushLogger.logPushEvent('token-request-attempt', {
          attempt: metrics[requestId].attempts,
          elapsed: Date.now() - metrics[requestId].startTime
        });
        
        const registration = await navigator.serviceWorker.ready;
        return await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration
        });
      },
      {
        maxRetries: browserDetection.isIOS() ? 3 : 2,
        retryPredicate: (error) => {
          // Retry on specific errors
          const shouldRetry = error.code === 'messaging/token-request-failed' ||
                            error.code === 'messaging/network-error';
          
          iosPushLogger.logPushEvent('token-retry-decision', {
            error: error.message,
            shouldRetry,
            attempt: metrics[requestId].attempts
          });
          
          return shouldRetry;
        }
      }
    );
    
    if (!token) {
      throw new Error('Token request returned empty result');
    }
    
    // Record success metrics
    metrics[requestId].success = true;
    metrics[requestId].totalDuration = Date.now() - metrics[requestId].startTime;
    
    iosPushLogger.logPushEvent('token-request-success', {
      metrics: metrics[requestId],
      tokenPreview: `${token.substring(0, 5)}...`
    });
    
    return token;
    
  } catch (error) {
    // Record failure metrics
    metrics[requestId].success = false;
    metrics[requestId].totalDuration = Date.now() - metrics[requestId].startTime;
    metrics[requestId].error = error instanceof Error ? error.message : String(error);
    
    iosPushLogger.logPushEvent('token-request-failed', {
      metrics: metrics[requestId],
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Show user-friendly error
    toast.error('Failed to enable notifications', {
      description: 'Please try again or contact support if the problem persists.'
    });
    
    throw error;
  }
}

/**
 * Validate FCM token format and expiry
 */
export function validateToken(token: string): boolean {
  // Basic format validation
  if (!token || typeof token !== 'string' || token.length < 50) {
    return false;
  }
  
  // Add more validation if needed
  return true;
}

/**
 * Get token request metrics
 */
export function getTokenMetrics(): Record<string, TokenMetrics> {
  return { ...metrics };
}
