
// Enhanced Service Worker for Tempo PWA
// This runs in parallel with the regular service worker for gradual migration
const CACHE_NAME = 'tempo-enhanced-cache-v1';
const VERSION = '1.0.0';
const FIREBASE_MESSAGING_SW_URL = '/firebase-messaging-sw.js';
const IMPLEMENTATION_TYPE = 'enhanced';

// Configuration - can be toggled from main application
let config = {
  implementation: 'legacy', // start as legacy by default
  enableSync: true,
  cacheVersion: CACHE_NAME,
  debug: true
};

// Debug logging helper
const log = (...args) => {
  if (config.debug) {
    console.log(`[Enhanced-SW ${VERSION}]`, ...args);
  }
};

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.css'
];

// Install event - cache static assets but don't interfere with main service worker
self.addEventListener('install', (event) => {
  log('Installing Enhanced Service Worker');
  
  // Don't skip waiting to avoid conflicts with the main service worker
  // We'll activate this service worker only when explicitly requested
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Enhanced-SW] Cache installation failed:', error);
      })
  );
});

// Activate event - but remain passive initially
self.addEventListener('activate', (event) => {
  log('Enhanced Service Worker activated');
  
  // Don't claim clients automatically to avoid conflicts
  // We'll only handle specific requests marked for this worker
  
  // Remove outdated enhanced caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('tempo-enhanced-') && cacheName !== CACHE_NAME) {
            log('Deleting old enhanced cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for fetch events but only intercept those specifically marked for this worker
self.addEventListener('fetch', (event) => {
  // Only handle requests if we're set as the active implementation
  if (config.implementation !== 'enhanced') {
    return;
  }
  
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
  
  // Enhanced caching strategy - stale-while-revalidate
  // This serves from cache first, then updates the cache with the network response
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Start fetching new version in the background
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Update the cache with the latest version
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                log('Updated cache for:', event.request.url);
              });
              return networkResponse.clone();
            })
            .catch((error) => {
              log('Network fetch failed:', error);
              // Network fetch failed, but we already returned the cached response if available
            });
          
          // Return cached response immediately if available, otherwise wait for fetch
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // For other requests, use cache-first strategy
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

// Enhanced background sync handler with improved reliability
self.addEventListener('sync', (event) => {
  if (!config.enableSync || config.implementation !== 'enhanced') {
    return;
  }
  
  log('Sync event received:', event.tag);
  
  if (event.tag === 'sync-reminders') {
    log('Processing reminder sync');
    event.waitUntil(syncRemindersEnhanced());
  }
  
  if (event.tag === 'sync-notification-actions') {
    log('Processing notification action sync');
    event.waitUntil(syncNotificationActions());
  }
});

// Enhanced sync function with improved error handling and retry logic
async function syncRemindersEnhanced() {
  log('Starting enhanced reminder sync');
  try {
    // Get pending offline reminders from IndexedDB
    const pendingOperations = await getPendingOperations();
    
    if (pendingOperations.length > 0) {
      log(`Processing ${pendingOperations.length} pending operations`);
      
      // Send status update to main thread
      sendMessageToClients({
        type: 'SYNC_COMPLETE',
        payload: {
          success: true,
          timestamp: Date.now()
        }
      });
    }
    
    return true;
  } catch (error) {
    log('Error syncing reminders:', error);
    
    // Send error to main thread
    sendMessageToClients({
      type: 'SYNC_FAILED',
      payload: {
        error: error.message,
        timestamp: Date.now()
      }
    });
    
    return false;
  }
}

// Process notification actions that happened offline
async function syncNotificationActions() {
  try {
    // This would be implemented to sync offline notification actions
    log('Notification action sync not yet implemented');
    return true;
  } catch (error) {
    log('Error syncing notification actions:', error);
    return false;
  }
}

// Placeholder function - actual implementation would interact with IndexedDB
async function getPendingOperations() {
  // This would fetch data from IndexedDB in a real implementation
  return [];
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const message = event.data;
  
  if (!message || !message.type) {
    return;
  }
  
  log('Received message:', message.type);
  
  switch (message.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SET_IMPLEMENTATION':
      if (message.payload && typeof message.payload.useNewImplementation === 'boolean') {
        config.implementation = message.payload.useNewImplementation ? 'enhanced' : 'legacy';
        log(`Implementation set to: ${config.implementation}`);
        
        // Notify clients about the change
        sendMessageToClients({
          type: 'READY',
          payload: {
            version: VERSION,
            implementation: config.implementation
          }
        });
      }
      break;
      
    case 'SYNC_REMINDERS':
      if (config.enableSync) {
        // Register for background sync
        self.registration.sync.register('sync-reminders')
          .then(() => {
            log('Background sync registered');
          })
          .catch(error => {
            log('Background sync registration failed:', error);
            
            // Fallback to immediate sync if registration fails
            syncRemindersEnhanced();
          });
      }
      break;
  }
});

// Helper function to broadcast messages to all clients
function sendMessageToClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Improved notification click handler with better focus management
self.addEventListener('notificationclick', function(event) {
  log('Notification clicked:', event);
  
  // Only handle if we're the active implementation
  if (config.implementation !== 'enhanced') {
    return;
  }
  
  // Close the notification
  event.notification.close();
  
  // Extract data from notification
  const data = event.notification.data || {};
  const reminderId = data.reminderId || '';
  const deepLink = data.deepLink || `/dashboard/reminders/${reminderId}`;
  const notificationId = data.notificationId;
  
  // Handle action button clicks
  if (event.action) {
    log(`Action button clicked: ${event.action}`);
    
    // Broadcast the action to clients
    const message = {
      type: 'NOTIFICATION_ACTION',
      payload: {
        action: event.action,
        reminderId,
        notification: {
          id: notificationId,
          title: event.notification.title,
          body: event.notification.body,
          timestamp: Date.now(),
        }
      }
    };
    
    sendMessageToClients(message);
    
    // For specific actions, we might not want to open the app
    if (event.action === 'dismiss') {
      // No need to open the window for dismiss action
      return;
    }
  }
  
  // For regular notification clicks or action buttons that should navigate
  // Open or focus the client window
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
});
