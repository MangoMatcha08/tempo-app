
// Enhanced Service Worker for Tempo PWA
// This runs in parallel with the regular service worker for gradual migration
const VERSION = '1.0.1';
const BASE_CACHE_NAME = 'tempo-enhanced';
const CACHE_VERSIONS = {
  static: `${BASE_CACHE_NAME}-static-v1`,
  notifications: `${BASE_CACHE_NAME}-notifications-v1`,
  documents: `${BASE_CACHE_NAME}-documents-v1`,
  images: `${BASE_CACHE_NAME}-images-v1`,
  api: `${BASE_CACHE_NAME}-api-v1`
};

const FIREBASE_MESSAGING_SW_URL = '/firebase-messaging-sw.js';
const IMPLEMENTATION_TYPE = 'enhanced';

// Maximum number of items in each cache
const CACHE_LIMITS = {
  notifications: 500,
  documents: 100,
  images: 200,
  api: 50
};

// Expiration times in milliseconds
const EXPIRATION_TIMES = {
  notifications: {
    high: 30 * 24 * 60 * 60 * 1000,  // 30 days for high priority
    medium: 7 * 24 * 60 * 60 * 1000, // 7 days for medium priority
    low: 3 * 24 * 60 * 60 * 1000     // 3 days for low priority
  },
  documents: 14 * 24 * 60 * 60 * 1000, // 14 days
  images: 30 * 24 * 60 * 60 * 1000,    // 30 days
  api: 24 * 60 * 60 * 1000             // 1 day
};

// Configuration - can be toggled from main application
let config = {
  implementation: 'legacy', // start as legacy by default
  enableSync: true,
  cacheVersion: BASE_CACHE_NAME,
  debug: true,
  cachingEnabled: true,
  cacheMaintenanceInterval: 24 * 60 * 60 * 1000 // 24 hours
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
  log('Installing Enhanced Service Worker version', VERSION);
  
  // Don't skip waiting to avoid conflicts with the main service worker
  
  event.waitUntil(
    caches.open(CACHE_VERSIONS.static)
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
  
  // Remove outdated caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith(BASE_CACHE_NAME) && 
              !Object.values(CACHE_VERSIONS).includes(cacheName)) {
            log('Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Schedule the first cache maintenance
      scheduleCacheMaintenance();
    })
  );
});

// Determine cache type based on URL
function getCacheTypeFromUrl(url) {
  const urlObj = new URL(url);
  
  if (url.includes('/api/notifications') || 
      url.includes('/notifications/') ||
      url.includes('notification')) {
    return 'notifications';
  }
  
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    return 'images';
  }
  
  if (url.match(/\.(pdf|doc|docx|xls|xlsx|txt|csv|json)$/i)) {
    return 'documents';
  }
  
  if (url.includes('/api/')) {
    return 'api';
  }
  
  // Default to static
  return 'static';
}

// Get cache name for a specific request
function getCacheName(request) {
  const url = new URL(request.url);
  const type = getCacheTypeFromUrl(url.toString());
  return CACHE_VERSIONS[type] || CACHE_VERSIONS.static;
}

// Determine caching strategy based on URL and request type
function getStrategy(request) {
  const url = request.url;
  
  // Special handling for Firebase or API calls - network only
  if (url.includes('firestore.googleapis.com') || 
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('firebaseappcheck.googleapis.com')) {
    return 'network-only';
  }
  
  // Navigation requests - stale-while-revalidate
  if (request.mode === 'navigate') {
    return 'stale-while-revalidate';
  }
  
  // API requests - network-first
  if (url.includes('/api/')) {
    return 'network-first';
  }
  
  // High priority notifications - cache-first with background update
  if (url.includes('/notifications/high')) {
    return 'stale-while-revalidate';
  }
  
  // Images and other static assets - cache-first
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i)) {
    return 'cache-first';
  }
  
  // Default to stale-while-revalidate
  return 'stale-while-revalidate';
}

// Network-first strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache the response if successful
    if (networkResponse.ok && config.cachingEnabled) {
      const clonedResponse = networkResponse.clone();
      
      // Store with metadata
      const cache = await caches.open(cacheName);
      
      // Add metadata to the response
      const responseWithMetadata = {
        url: request.url,
        timestamp: Date.now(),
        priority: getPriorityFromUrl(request.url),
        response: await clonedResponse.blob()
      };
      
      // Store indexed by URL
      await storeWithMetadata(cache, request.url, responseWithMetadata);
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try from cache
    log('Network request failed, falling back to cache', request.url);
    const cachedResponse = await getCachedResponse(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Nothing in cache either, throw the original error
    throw error;
  }
}

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
  // Try cache first
  const cachedResponse = await getCachedResponse(request);
  
  if (cachedResponse) {
    // Also update the cache in the background
    if (config.cachingEnabled) {
      fetch(request)
        .then(response => {
          if (response.ok) {
            updateCachedResponse(cacheName, request.url, response);
          }
        })
        .catch(error => log('Background cache update failed', error));
    }
    
    return cachedResponse;
  }
  
  // Not in cache, use network
  const networkResponse = await fetch(request);
  
  // Cache the response if successful
  if (networkResponse.ok && config.cachingEnabled) {
    const cache = await caches.open(cacheName);
    const clonedResponse = networkResponse.clone();
    
    // Add metadata to the response
    const responseWithMetadata = {
      url: request.url,
      timestamp: Date.now(),
      priority: getPriorityFromUrl(request.url),
      response: await clonedResponse.blob()
    };
    
    await storeWithMetadata(cache, request.url, responseWithMetadata);
  }
  
  return networkResponse;
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request, cacheName) {
  // Get from cache
  const cachedResponse = await getCachedResponse(request);
  
  // Fetch from network in the background
  const networkPromise = fetch(request)
    .then(response => {
      // Update cache with fresh response
      if (response.ok && config.cachingEnabled) {
        const clonedResponse = response.clone();
        updateCachedResponse(cacheName, request.url, clonedResponse);
      }
      return response;
    })
    .catch(error => {
      log('Network fetch failed in stale-while-revalidate', error);
      // If both cache and network fail, this will throw
      if (!cachedResponse) {
        throw error;
      }
    });
  
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || networkPromise;
}

// Network-only strategy
async function networkOnlyStrategy(request) {
  return fetch(request);
}

// Get a cached response with metadata handling
async function getCachedResponse(request) {
  const cacheName = getCacheName(request);
  const cache = await caches.open(cacheName);
  
  try {
    // Try to get the entry with metadata
    const metadata = await cache.match(`metadata:${request.url}`);
    
    if (metadata) {
      const data = await metadata.json();
      
      // Check if expired
      if (isExpired(data)) {
        log('Cache entry expired, removing', request.url);
        await cache.delete(`metadata:${request.url}`);
        await cache.delete(request.url);
        return null;
      }
      
      // Get the actual response
      const cachedBlob = await cache.match(request.url);
      if (cachedBlob) {
        // Update last accessed timestamp in the metadata
        data.lastAccessed = Date.now();
        await cache.put(`metadata:${request.url}`, new Response(JSON.stringify(data)));
        
        return cachedBlob;
      }
    } else {
      // Legacy cache entry without metadata
      return await cache.match(request);
    }
  } catch (error) {
    log('Error retrieving from cache', error);
    return null;
  }
  
  return null;
}

// Check if a cached item is expired
function isExpired(metadata) {
  const now = Date.now();
  const cacheType = getCacheTypeFromUrl(metadata.url);
  let maxAge;
  
  if (cacheType === 'notifications') {
    // Use priority-based expiration for notifications
    maxAge = EXPIRATION_TIMES.notifications[metadata.priority || 'medium'];
  } else {
    // Use cache type based expiration for other resources
    maxAge = EXPIRATION_TIMES[cacheType] || EXPIRATION_TIMES.api;
  }
  
  return (now - metadata.timestamp) > maxAge;
}

// Get priority from URL
function getPriorityFromUrl(url) {
  if (url.includes('/priority=high') || url.includes('priority=urgent')) {
    return 'high';
  } else if (url.includes('/priority=low')) {
    return 'low';
  }
  return 'medium';
}

// Store a response with metadata
async function storeWithMetadata(cache, url, responseData) {
  try {
    // Store the actual response
    const responseHeaders = {
      'Cache-Control': 'max-age=86400',
      'Content-Type': 'application/octet-stream' // Default content type
    };
    await cache.put(url, new Response(responseData.response, { headers: responseHeaders }));
    
    // Store the metadata separately
    const metadata = {
      url: url,
      timestamp: responseData.timestamp,
      lastAccessed: responseData.timestamp,
      priority: responseData.priority,
      size: responseData.response.size || 0
    };
    
    await cache.put(`metadata:${url}`, new Response(JSON.stringify(metadata)));
    
    // Check if we need to run cache cleanup
    const cacheType = getCacheTypeFromUrl(url);
    await enforceQuota(cacheType);
    
  } catch (error) {
    log('Error storing with metadata', error);
  }
}

// Update a cached response
async function updateCachedResponse(cacheName, url, response) {
  const cache = await caches.open(cacheName);
  const clonedResponse = response.clone();
  
  try {
    // Check if metadata exists
    const metadataEntry = await cache.match(`metadata:${url}`);
    
    if (metadataEntry) {
      // Update existing metadata
      const metadata = await metadataEntry.json();
      metadata.timestamp = Date.now();
      await cache.put(`metadata:${url}`, new Response(JSON.stringify(metadata)));
    } else {
      // Create new metadata
      const metadata = {
        url: url,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        priority: getPriorityFromUrl(url),
        size: 0  // We'll update this after storing the response
      };
      await cache.put(`metadata:${url}`, new Response(JSON.stringify(metadata)));
    }
    
    // Update the actual response
    await cache.put(url, clonedResponse);
    
  } catch (error) {
    log('Error updating cached response', error);
  }
}

// Enforce cache quota limits
async function enforceQuota(cacheType) {
  if (!CACHE_LIMITS[cacheType]) return;
  
  const cacheName = CACHE_VERSIONS[cacheType];
  const maxItems = CACHE_LIMITS[cacheType];
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  // Filter out metadata entries and count actual resources
  const contentKeys = keys.filter(key => !key.url.startsWith('metadata:'));
  
  if (contentKeys.length <= maxItems) {
    return; // We're under the limit
  }
  
  log(`Cache ${cacheType} over quota (${contentKeys.length}/${maxItems}), cleaning up`);
  
  // Gather all metadata for sorting
  const metadataEntries = [];
  for (const key of contentKeys) {
    const metadataKey = `metadata:${key.url}`;
    const metadata = await cache.match(metadataKey);
    
    if (metadata) {
      try {
        const data = await metadata.json();
        metadataEntries.push(data);
      } catch (e) {
        // If metadata is corrupted, mark for deletion with a low priority
        metadataEntries.push({
          url: key.url,
          timestamp: 0,
          lastAccessed: 0,
          priority: 'low'
        });
      }
    } else {
      // No metadata found, use defaults
      metadataEntries.push({
        url: key.url,
        timestamp: 0,
        lastAccessed: 0,
        priority: 'low'
      });
    }
  }
  
  // Sort entries by priority (high ones stay), then by last accessed (recent ones stay)
  const priorityWeights = { 'high': 3, 'medium': 2, 'low': 1 };
  
  metadataEntries.sort((a, b) => {
    const priorityDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return b.lastAccessed - a.lastAccessed;
  });
  
  // Delete entries starting from the end of the sorted list
  const entriesToRemove = metadataEntries.slice(maxItems);
  
  for (const entry of entriesToRemove) {
    await cache.delete(entry.url);
    await cache.delete(`metadata:${entry.url}`);
    log(`Removed from cache: ${entry.url} (priority: ${entry.priority})`);
  }
}

// Schedule periodic cache maintenance
function scheduleCacheMaintenance() {
  setInterval(async () => {
    log('Running scheduled cache maintenance');
    await runCacheMaintenance();
  }, config.cacheMaintenanceInterval);
}

// Run full cache maintenance
async function runCacheMaintenance() {
  try {
    log('Starting cache maintenance');
    
    // Clean up all cache types
    for (const cacheType of Object.keys(CACHE_VERSIONS)) {
      await cleanupExpiredItems(cacheType);
      await enforceQuota(cacheType);
    }
    
    log('Cache maintenance completed');
  } catch (error) {
    log('Error during cache maintenance', error);
  }
}

// Clean up expired items in a specific cache
async function cleanupExpiredItems(cacheType) {
  const cacheName = CACHE_VERSIONS[cacheType];
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  // Get all metadata entries
  const metadataKeys = keys.filter(key => key.url.startsWith('metadata:'));
  let removedCount = 0;
  
  for (const key of metadataKeys) {
    try {
      const response = await cache.match(key);
      const metadata = await response.json();
      
      if (isExpired(metadata)) {
        // Extract the original URL from metadata key
        const originalUrl = key.url.replace('metadata:', '');
        
        // Remove both metadata and content
        await cache.delete(key);
        await cache.delete(originalUrl);
        removedCount++;
      }
    } catch (error) {
      log('Error processing cache entry', key.url, error);
    }
  }
  
  log(`Cleaned up ${removedCount} expired items from ${cacheType} cache`);
}

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
  
  // Determine the appropriate caching strategy
  const strategy = getStrategy(event.request);
  const cacheName = getCacheName(event.request);
  
  // Apply the selected strategy
  if (strategy === 'network-first') {
    event.respondWith(networkFirstStrategy(event.request, cacheName));
  } 
  else if (strategy === 'cache-first') {
    event.respondWith(cacheFirstStrategy(event.request, cacheName));
  }
  else if (strategy === 'stale-while-revalidate') {
    event.respondWith(staleWhileRevalidateStrategy(event.request, cacheName));
  }
  else if (strategy === 'network-only') {
    event.respondWith(networkOnlyStrategy(event.request));
  }
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
  
  if (event.tag === 'cache-maintenance') {
    log('Running cache maintenance from sync');
    event.waitUntil(runCacheMaintenance());
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
      
    case 'CACHE_MAINTENANCE':
      // Run cache maintenance on demand
      runCacheMaintenance()
        .then(() => {
          sendMessageToClients({
            type: 'CACHE_MAINTENANCE_COMPLETE',
            payload: {
              success: true,
              timestamp: Date.now()
            }
          });
        })
        .catch(error => {
          sendMessageToClients({
            type: 'CACHE_MAINTENANCE_COMPLETE',
            payload: {
              success: false,
              error: error.message,
              timestamp: Date.now()
            }
          });
        });
      break;
      
    case 'UPDATE_CONFIG':
      if (message.payload && typeof message.payload.config === 'object') {
        config = { ...config, ...message.payload.config };
        log('Configuration updated', config);
      }
      break;
  }
  
  // Send response if a port was provided
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ success: true });
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

// Register scheduled cache maintenance on periodicsync if available
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-maintenance') {
      event.waitUntil(runCacheMaintenance());
    }
  });
  
  // Try to register periodic sync
  try {
    self.registration.periodicSync.register('cache-maintenance', {
      minInterval: 24 * 60 * 60 * 1000 // Once a day
    });
  } catch (error) {
    log('Periodic sync registration failed, using setInterval instead', error);
  }
}
