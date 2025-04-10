
// Add emulator mode detection to ServiceWorkerMessage type

export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
  emulatorMode?: boolean; 
}

export interface FirebaseMessagingPayload {
  data?: any;
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    click_action?: string;
  };
  fcmOptions?: {
    link?: string;
  };
}

export interface NotificationActionPayload {
  reminderId?: string;
  action: string;
  notification?: {
    id: string;
    title: string;
  };
}

export interface AppMessage {
  type: string;
  payload?: any;
}

export const SERVICE_WORKER_FEATURES = {
  BACKGROUND_SYNC: true,
  OFFLINE_SUPPORT: true,
  NOTIFICATION_GROUPING: true,
  PUSH_NOTIFICATION_ACTIONS: true,
  PERIODIC_SYNC: false, // Not widely supported yet
  ADVANCED_CACHING: true,
  AUTO_CLEANUP: true
};
