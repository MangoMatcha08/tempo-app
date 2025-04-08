
// Service Worker for Tempo PWA
const CACHE_NAME = 'tempo-cache-v1';
const REMINDER_CACHE_NAME = 'tempo-reminders-v1';
const FIREBASE_MESSAGING_SW_URL = '/firebase-messaging-sw.js';

// Debug mode in development
const DEBUG = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Performance metrics
const PERFORMANCE = {
  cacheHits: 0,
  cacheMisses: 0,
  totalOperations: 0,
  apiCalls: 0,
  startTime: Date.now()
};

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.css',
  // Add more static resources as needed
];

// Default cache configuration
let CACHE_CONFIG = {
  enabled: true,
  reminderExpiration: 5 * 60 * 1000, // 5 minutes
  completedReminderExpiration: 30 * 60 * 1000, // 30 minutes
  maintenanceInterval: 60 * 60 * 1000, // 1 hour
  lastMaintenance: 0,
  debug: DEBUG
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker');
  
  // Take control of all clients
  event.waitUntil(clients.claim());
  
  // Remove outdated caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== REMINDER_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Send ready message to clients
      sendMessageToAllClients({
        type: 'READY',
        payload: {
          version: '1.1.0',
          timestamp: Date.now()
        }
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
  
  // Don't cache API calls, Firebase, or localhost API
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('firebaseappcheck.googleapis.com') ||
    event.request.url.includes('localhost:3000/api')
  ) {
    // For API calls, we'll use network-first with cache fallback
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache successful GET responses
          if (response.ok && event.request.method === 'GET') {
            // Clone the response before returning it
            const clonedResponse = response.clone();
            
            // Cache API response if it's a GET for reminders
            if (event.request.url.includes('reminders') || 
                event.request.url.includes('notifications')) {
                
              if (CACHE_CONFIG.enabled) {
                caches.open(REMINDER_CACHE_NAME).then(cache => {
                  cache.put(event.request, clonedResponse);
                  
                  if (DEBUG) console.debug(`[Service Worker] Cached API response: ${event.request.url}`);
                  
                  // Track performance
                  PERFORMANCE.apiCalls++;
                });
              }
            }
          }
          
          // Return original response
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          if (CACHE_CONFIG.enabled) {
            return caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                if (DEBUG) console.debug(`[Service Worker] Serving API from cache: ${event.request.url}`);
                
                // Track performance
                PERFORMANCE.cacheHits++;
                PERFORMANCE.totalOperations++;
                
                return cachedResponse;
              }
              
              // Track performance
              PERFORMANCE.cacheMisses++;
              PERFORMANCE.totalOperations++;
              
              // No cache, return error response
              return new Response(JSON.stringify({ error: 'Network error, and no cached data available' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              });
            });
          } else {
            // If caching is disabled, return network error
            return new Response(JSON.stringify({ error: 'Network error' }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            });
          }
        })
    );
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
          // Track performance
          PERFORMANCE.cacheHits++;
          PERFORMANCE.totalOperations++;
          
          return cachedResponse;
        }
        
        // Track performance
        PERFORMANCE.cacheMisses++;
        PERFORMANCE.totalOperations++;
        
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
    console.log('[Service Worker] Syncing reminders');
    event.waitUntil(syncReminders());
  }
});

// Offline reminder sync function
async function syncReminders() {
  try {
    // Get pending offline reminders from IndexedDB or localStorage
    const pendingOperations = await getPendingOperations();
    
    if (pendingOperations.length > 0) {
      console.log(`[Service Worker] Processing ${pendingOperations.length} pending operations`);
      // Process each operation when back online
      // This is just a placeholder - actual implementation would depend on app structure
    }
    
    return true;
  } catch (error) {
    console.error('[Service Worker] Error syncing reminders:', error);
    return false;
  }
}

// Placeholder function - actual implementation would interact with IndexedDB/localStorage
async function getPendingOperations() {
  // In a real implementation, this would fetch data from IndexedDB
  return [];
}

// Cache maintenance function
async function performCacheMaintenance() {
  try {
    const now = Date.now();
    
    // Only run maintenance if it's been long enough since last run
    if (now - CACHE_CONFIG.lastMaintenance < CACHE_CONFIG.maintenanceInterval) {
      return;
    }
    
    CACHE_CONFIG.lastMaintenance = now;
    
    if (DEBUG) {
      console.debug('[Service Worker] Performing cache maintenance');
    }
    
    // Reminder cache maintenance
    const reminderCache = await caches.open(REMINDER_CACHE_NAME);
    const cachedRequests = await reminderCache.keys();
    
    let expiredCount = 0;
    let keptCount = 0;
    
    for (const request of cachedRequests) {
      const response = await reminderCache.match(request);
      
      // Skip if no response
      if (!response) continue;
      
      // Check cache metadata if available
      const cacheControl = response.headers.get('Cache-Control');
      const expires = response.headers.get('Expires');
      
      let shouldDelete = false;
      
      // Handle expiration based on URL patterns
      if (request.url.includes('completed')) {
        shouldDelete = now - response.headers.get('Date') > CACHE_CONFIG.completedReminderExpiration;
      } else {
        shouldDelete = now - response.headers.get('Date') > CACHE_CONFIG.reminderExpiration;
      }
      
      // Delete expired items
      if (shouldDelete) {
        await reminderCache.delete(request);
        expiredCount++;
      } else {
        keptCount++;
      }
    }
    
    if (DEBUG) {
      console.debug(`[Service Worker] Cache maintenance complete: ${expiredCount} items removed, ${keptCount} items kept`);
    }
    
    // Send cache stats to clients
    sendCacheStats();
    
    return { expiredCount, keptCount };
  } catch (error) {
    console.error('[Service Worker] Error during cache maintenance:', error);
    return { expiredCount: 0, keptCount: 0, error: true };
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      clearAllCaches();
      break;
      
    case 'CACHE_MAINTENANCE':
      performCacheMaintenance().then(stats => {
        sendMessageToClient(event.ports[0], {
          type: 'CACHE_MAINTENANCE_COMPLETE',
          payload: { stats, success: true }
        });
      });
      break;
      
    case 'UPDATE_CONFIG':
      if (event.data.payload && event.data.payload.config) {
        CACHE_CONFIG = {
          ...CACHE_CONFIG,
          ...event.data.payload.config
        };
        
        if (DEBUG) {
          console.debug('[Service Worker] Updated cache config:', CACHE_CONFIG);
        }
        
        sendMessageToClient(event.ports[0], {
          type: 'READY',
          payload: { success: true }
        });
      }
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        sendMessageToClient(event.ports[0], {
          type: 'CACHE_STATS',
          payload: { stats, success: true }
        });
      });
      break;
      
    default:
      if (DEBUG) {
        console.debug('[Service Worker] Unknown message type:', event.data.type);
      }
  }
});

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  let totalSize = 0;
  let totalItems = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    // Calculate approximate size (this is an estimation)
    let cacheSize = 0;
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && response.headers.has('content-length')) {
        cacheSize += parseInt(response.headers.get('content-length') || '0', 10);
      } else if (response) {
        // If no content-length, estimate based on URL
        cacheSize += request.url.length * 2; // Very rough estimate
      }
    }
    
    stats[cacheName] = {
      size: cacheSize,
      itemCount: requests.length,
    };
    
    totalSize += cacheSize;
    totalItems += requests.length;
  }
  
  return {
    version: '1.1.0',
    implementation: 'enhanced',
    caches: stats,
    totalSize,
    totalItems,
    performance: {
      cacheHits: PERFORMANCE.cacheHits,
      cacheMisses: PERFORMANCE.cacheMisses,
      hitRate: PERFORMANCE.totalOperations === 0 ? 0 : 
        PERFORMANCE.cacheHits / PERFORMANCE.totalOperations,
      apiCalls: PERFORMANCE.apiCalls,
      uptime: (Date.now() - PERFORMANCE.startTime) / 1000 // in seconds
    }
  };
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Reset performance metrics
    PERFORMANCE.cacheHits = 0;
    PERFORMANCE.cacheMisses = 0;
    PERFORMANCE.totalOperations = 0;
    PERFORMANCE.apiCalls = 0;
    
    if (DEBUG) {
      console.debug('[Service Worker] All caches cleared');
    }
    
    return true;
  } catch (error) {
    console.error('[Service Worker] Error clearing caches:', error);
    return false;
  }
}

// Send message to specific client
function sendMessageToClient(port, message) {
  if (port && port.postMessage) {
    port.postMessage(message);
    return true;
  }
  return false;
}

// Send message to all clients
async function sendMessageToAllClients(message) {
  const clients = await self.clients.matchAll();
  return Promise.all(clients.map(client => {
    return client.postMessage(message);
  }));
}

// Send cache stats to all clients
async function sendCacheStats() {
  const stats = await getCacheStats();
  return sendMessageToAllClients({
    type: 'CACHE_STATS',
    payload: { stats }
  });
}

// Set up periodic cache maintenance
setInterval(() => {
  if (CACHE_CONFIG.enabled) {
    performCacheMaintenance();
  }
}, CACHE_CONFIG.maintenanceInterval);
