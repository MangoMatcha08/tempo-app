
/**
 * Service Worker management for notifications
 * Handles registration and lifecycle of the service worker
 */

import { iosPushLogger } from '@/utils/iosPushLogger';
import { PermissionRequestResult, PermissionErrorReason } from '@/types/notifications';
import { timeout } from '@/utils/iosPermissionTimings';
import { SERVICE_WORKER_CONFIG } from '@/utils/serviceWorkerConfig';

/**
 * Register service worker for push notifications
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration> {
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    iosPushLogger.logPermissionStep('service-worker-registered', {
      scope: registration.scope
    });
    
    return registration;
  } catch (error) {
    iosPushLogger.logPermissionStep('service-worker-failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

/**
 * Ensure service worker is ready and registered
 */
export async function ensureServiceWorker(timeoutMs: number): Promise<ServiceWorkerRegistration> {
  try {
    // First check if we already have a registered service worker
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      return existing;
    }

    // If not, register a new one
    return await timeout(
      registerNotificationServiceWorker(),
      timeoutMs,
      'Service worker registration timed out'
    );
  } catch (error) {
    throw new Error(
      `Service worker registration failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

