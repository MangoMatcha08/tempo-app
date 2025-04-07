
/**
 * Type definitions for Service Worker interactions
 */

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
  periodicSync?: {
    register(tag: string, options: { minInterval: number }): Promise<void>;
  };
}

interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

interface ServiceWorkerGlobalScope extends ServiceWorkerGlobalScopeEventMap {
  registration: ExtendedServiceWorkerRegistration;
}

interface FirebaseMessagingPayload {
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data: {
    [key: string]: string;
    reminderId?: string;
    userId?: string;
    priority?: string;
    type?: string;
    timestamp?: string;
    deepLink?: string;
    tag?: string;
  };
}

interface NotificationOptions extends NotificationOptions {
  data?: {
    [key: string]: any;
    reminderId?: string;
    userId?: string;
    timestamp?: number;
    deepLink?: string;
    priority?: string;
  };
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface NotificationEvent extends ExtendableEvent {
  notification: Notification & {
    data: any;
  };
  action: string;
}
