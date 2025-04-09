// This file is not compiled! It must use ES5 syntax or supported syntax by the target browsers.

importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB9CRFtt-AaGZ-yVpPdOBaTRzmdi73MMu8',
  authDomain: 'tempowizard-ac888.firebaseapp.com',
  projectId: 'tempowizard-ac888',
  storageBucket: 'tempowizard-ac888.firebasestorage.app',
  messagingSenderId: '773638364697',
  appId: '1:773638364697:web:bb37937aefdf2985a25488',
  measurementId: 'G-WW90RJ28BH'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging
const messaging = firebase.messaging();

/**
 * Make a network request to Firebase Function
 */
function callFirebaseFunction(action, data) {
  // Function URL - this should match your deployed function URL
  const functionUrl = 'https://us-central1-tempowizard-ac888.cloudfunctions.net/handleNotificationAction';
  
  return fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: action,
      reminderId: data.reminderId,
      userId: data.userId,
      timestamp: Date.now(),
      snoozeMinutes: action === 'snooze' ? 30 : undefined // Default snooze time
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .catch(error => {
    console.error('Error calling Firebase function:', error);
    // Cache the failed request for retry when online
    return { success: false, error: error.message };
  });
}

/**
 * Group notifications by period or category
 */
function getNotificationTag(data) {
  // If notification already has a tag, use it
  if (data.tag) return data.tag;
  
  const userId = data.userId || 'anonymous';
  let tag = `tempo-${userId}`;
  
  // Group by period if available
  if (data.periodId) {
    tag += `-period-${data.periodId}`;
  } 
  // Otherwise group by priority
  else if (data.priority) {
    tag += `-${data.priority}-priority`;
  }
  
  return tag;
}

/**
 * Handle background messages
 */
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'TempoWizard Reminder';
  const notificationBody = payload.notification.body || 'You have an upcoming reminder';
  const data = payload.data || {};
  
  // Create notification options with action buttons
  const notificationOptions = {
    body: notificationBody,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { ...data, timestamp: Date.now() },
    tag: getNotificationTag(data), // Group notifications
    renotify: true, // Notify even if replacing an existing notification
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
    requireInteraction: data.priority === 'high' // Keep high priority notifications visible
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click: ', event);
  
  // Close the notification
  event.notification.close();
  
  // Extract data from notification
  const data = event.notification.data || {};
  const reminderId = data.reminderId || '';
  const deepLink = data.deepLink || `/dashboard/reminders/${reminderId}`;
  
  // Handle action button clicks
  if (event.action === 'complete') {
    console.log('[firebase-messaging-sw.js] Complete action clicked');
    
    // Call Firebase function to mark reminder as complete
    event.waitUntil(
      callFirebaseFunction('complete', data)
    );
    
    // No need to open the app window for this action
    return;
  }
  
  if (event.action === 'snooze') {
    console.log('[firebase-messaging-sw.js] Snooze action clicked');
    
    // Call Firebase function to snooze the reminder
    event.waitUntil(
      callFirebaseFunction('snooze', data)
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
});

/**
 * Handle push events from FCM
 */
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push received', event);
  
  if (!event.data) {
    console.log('[firebase-messaging-sw.js] Push event has no data');
    return;
  }
  
  try {
    const payload = event.data.json();
    console.log('[firebase-messaging-sw.js] Push data:', payload);
    
    // Delegate to onBackgroundMessage handler
    messaging.onBackgroundMessage(payload);
  } catch (e) {
    console.error('[firebase-messaging-sw.js] Error handling push event:', e);
  }
});

// Basic offline caching for app shell (simple version compatible with iOS)
const CACHE_NAME = 'tempo-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
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

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Respond to ping messages with iOS info
  if (event.data && event.data.type === 'PING') {
    const client = event.source;
    client.postMessage({
      type: 'PONG',
      payload: {
        timestamp: Date.now(),
        version: 'consolidated-sw-v1',
        capabilities: {
          push: 'supported',
          notifications: 'supported',
          actions: self.registration.showNotification && self.Notification && self.Notification.maxActions > 0
        }
      }
    });
  }
});
