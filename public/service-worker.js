
// Service Worker for Tempo PWA
const CACHE_NAME = 'tempo-cache-v1';
const OFFLINE_QUEUE_NAME = 'tempo-offline-queue';
const FIREBASE_MESSAGING_SW_URL = '/firebase-messaging-sw.js';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add more static resources as needed
];

// Logging system
const logger = {
  debug: (...args) => {
    if (self.logLevel === 'debug') {
      console.debug('[Service Worker]', ...args);
    }
  },
  log: (...args) => console.log('[Service Worker]', ...args),
  warn: (...args) => console.warn('[Service Worker]', ...args),
  error: (...args) => console.error('[Service Worker]', ...args),
};

// Configuration
self.logLevel = 'info'; // 'debug' | 'info' | 'warn' | 'error'
self.offlineQueueEnabled = true;
self.syncEnabled = 'sync' in self.registration;

// Helper function to open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_NAME, 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object store for offline queue
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const store = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('action', 'action');
        logger.log('Offline queue database created');
      }
    };
    
    request.onsuccess = event => {
      logger.log('Opened offline queue database');
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      logger.error('Error opening offline queue database:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Helper function to get items from offline queue
const getOfflineQueueItems = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offlineQueue', 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error('Error getting offline queue items:', error);
    return [];
  }
};

// Helper function to remove an item from the offline queue
const removeFromOfflineQueue = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offlineQueue', 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error('Error removing item from offline queue:', error);
    return false;
  }
};

// Handler for notification actions
const handleNotificationAction = async (action, reminderId, data = {}) => {
  logger.log(`Handling ${action} action for reminder ${reminderId}`);
  
  try {
    // Function URL - this should match your deployed function URL
    const functionUrl = 'https://us-central1-tempowizard-ac888.cloudfunctions.net/handleNotificationAction';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action,
        reminderId: reminderId,
        userId: data.userId || 'anonymous',
        timestamp: Date.now(),
        snoozeMinutes: action === 'snooze' ? (data.snoozeMinutes || 30) : undefined
      })
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const result = await response.json();
    logger.log(`Action ${action} for reminder ${reminderId} successful:`, result);
    return { success: true, result };
  } catch (error) {
    logger.error(`Error handling ${action} action:`, error);
    return { success: false, error: error.message };
  }
};

// Helper function to process offline queue
const processOfflineQueue = async () => {
  if (!self.offlineQueueEnabled) {
    logger.log('Offline queue is disabled');
    return;
  }
  
  if (!navigator.onLine) {
    logger.log('Still offline, cannot process queue');
    return;
  }
  
  try {
    logger.log('Processing offline queue');
    
    const items = await getOfflineQueueItems();
    if (items.length === 0) {
      logger.log('No items in offline queue');
      return;
    }
    
    logger.log(`Found ${items.length} items in offline queue`);
    
    // Process each item
    for (const item of items) {
      try {
        logger.log(`Processing offline item: ${item.action} for ${item.reminderId}`);
        
        // Process the action
        const result = await handleNotificationAction(item.action, item.reminderId, item.payload);
        
        if (result.success) {
          // Remove from queue if successful
          await removeFromOfflineQueue(item.id);
          logger.log(`Successfully processed and removed item ${item.id} from queue`);
        } else {
          // Increase retry count for failed items
          // This would require updating the item in the queue
          logger.warn(`Failed to process item ${item.id}`);
        }
      } catch (itemError) {
        logger.error(`Error processing offline queue item ${item.id}:`, itemError);
      }
    }
    
    // Notify clients that the queue has been processed
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'OFFLINE_QUEUE_PROCESSED',
        payload: {
          timestamp: Date.now()
        }
      });
    }
  } catch (error) {
    logger.error('Error processing offline queue:', error);
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  logger.log('Installing Service Worker');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        logger.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        logger.error('Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  logger.log('Activating Service Worker');
  
  // Take control of all clients
  event.waitUntil(clients.claim());
  
  // Remove outdated caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            logger.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Notify clients that service worker is ready
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'READY',
          payload: {
            timestamp: Date.now()
          }
        });
      });
    })
  );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
  // Special handling for Firebase messaging service worker
  if (event.request.url.includes(FIREBASE_MESSAGING_SW_URL)) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Don't cache API calls or Firebase
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('firebaseappcheck.googleapis.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For navigation requests, try network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache the latest version
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => {
          // If network fails, try to return from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other requests, try cache first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }
        
        // No cached response, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache the network response for future use
            if (
              networkResponse.ok && 
              networkResponse.status === 200 &&
              !event.request.url.includes('chrome-extension')
            ) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
            
            return networkResponse;
          });
      })
  );
});

// Background sync handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    logger.log('Syncing reminders');
    event.waitUntil(processOfflineQueue());
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  logger.debug('Received message from client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
    const { action, reminderId, ...data } = event.data.payload;
    
    if (action && reminderId) {
      event.waitUntil(
        handleNotificationAction(action, reminderId, data)
          .then(result => {
            // Notify client of result
            if (event.source && event.source.postMessage) {
              event.source.postMessage({
                type: 'NOTIFICATION_ACTION_RESULT',
                payload: {
                  action,
                  reminderId,
                  success: result.success,
                  error: result.error,
                  timestamp: Date.now()
                }
              });
            }
          })
      );
    }
  } else if (event.data && event.data.type === 'PROCESS_OFFLINE_QUEUE') {
    event.waitUntil(processOfflineQueue());
  } else if (event.data && event.data.type === 'SET_LOG_LEVEL') {
    self.logLevel = event.data.payload.level || 'info';
    logger.log(`Log level set to ${self.logLevel}`);
  }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  logger.log('Notification click:', event);
  
  // Close the notification
  event.notification.close();
  
  // Extract data from notification
  const data = event.notification.data || {};
  const reminderId = data.reminderId || '';
  const deepLink = data.deepLink || `/dashboard/reminders/${reminderId}`;
  
  // Handle action button clicks
  if (event.action === 'complete') {
    logger.log('Complete action clicked');
    
    // Call function to mark reminder as complete
    event.waitUntil(
      handleNotificationAction('complete', reminderId, data)
    );
    
    // No need to open the app window for this action
    return;
  }
  
  if (event.action === 'snooze') {
    logger.log('Snooze action clicked');
    
    // Call function to snooze the reminder
    event.waitUntil(
      handleNotificationAction('snooze', reminderId, data)
    );
    
    // No need to open the app window for this action
    return;
  }
  
  // For regular notification clicks (not action buttons)
  // Open or focus the app window
  const urlToOpen = new URL(deepLink, self.location.origin).href;
  
  const openPromise = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Check if there is an existing open window
    for (const client of clientList) {
      if (client.url.includes('/dashboard') && 'focus' in client) {
        // Navigate existing client to the specific reminder
        return client.navigate(urlToOpen).then(client => client.focus());
      }
    }
    // If no existing window, open a new one
    return self.clients.openWindow(urlToOpen);
  });
  
  event.waitUntil(openPromise);
  
  // Notify clients about the click
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          payload: {
            reminderId,
            notification: {
              id: data.id || 'unknown',
              title: event.notification.title,
              body: event.notification.body
            }
          }
        });
      });
    })
  );
});

// Handle push events from FCM
self.addEventListener('push', function(event) {
  logger.log('Push received', event);
  
  if (!event.data) {
    logger.log('Push event has no data');
    return;
  }
  
  try {
    const payload = event.data.json();
    logger.log('Push data:', payload);
    
    const notificationTitle = payload.notification?.title || 'TempoWizard Reminder';
    const notificationBody = payload.notification?.body || 'You have an upcoming reminder';
    const data = payload.data || {};
    
    // Create notification options with action buttons
    const notificationOptions = {
      body: notificationBody,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { ...data, timestamp: Date.now() },
      tag: data.tag || `tempo-${data.userId || 'anonymous'}-${Date.now()}`,
      renotify: true,
      actions: [
        {
          action: 'complete',
          title: 'Complete'
        },
        {
          action: 'snooze',
          title: 'Snooze 30m'
        }
      ],
      requireInteraction: data.priority === 'high'
    };
    
    // Show notification
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => {
          // Notify clients about the notification
          return self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'NOTIFICATION_RECEIVED',
                payload: {
                  notification: {
                    title: notificationTitle,
                    body: notificationBody,
                    data
                  }
                }
              });
            });
          });
        })
    );
  } catch (e) {
    logger.error('Error handling push event:', e);
  }
});

// Handle online/offline events
self.addEventListener('online', () => {
  logger.log('Service worker detected online status');
  
  // Process the offline queue when back online
  processOfflineQueue();
});

// Log errors to help with debugging
self.addEventListener('error', event => {
  logger.error('Service worker error:', event.error);
});

// Log unhandled promise rejections
self.addEventListener('unhandledrejection', event => {
  logger.error('Service worker unhandled promise rejection:', event.reason);
});

// Log online status at startup
logger.log(`Service worker starting. Online: ${navigator.onLine}. Sync supported: ${self.syncEnabled}`);

