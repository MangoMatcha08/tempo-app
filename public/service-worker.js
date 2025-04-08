
// Service Worker for Tempo PWA
const CACHE_NAME = 'tempo-cache-v1';
const FIREBASE_MESSAGING_SW_URL = '/firebase-messaging-sw.js';

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
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
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

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
