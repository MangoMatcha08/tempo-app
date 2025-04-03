// This file contains the implementation of a service worker for Firebase Cloud Messaging
// It must be placed at the root of your app's public directory

importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

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

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Log service worker activation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  self.skipWaiting(); // Ensure service worker activates immediately
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  event.waitUntil(clients.claim()); // Take control of all clients
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Extract user ID from the payload if available
  const userId = payload.data?.userId || 'anonymous';
  console.log('[firebase-messaging-sw.js] Message intended for user:', userId);
  
  // Extract reminder ID if available
  const reminderId = payload.data?.reminderId || null;
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Tempo Reminder';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new reminder',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      ...payload.data,
      userId: userId,
      reminderId: reminderId,
      timestamp: new Date().getTime(),
      url: '/dashboard'
    },
    tag: `tempo-notification-${userId}-${reminderId || Date.now()}`, // Ensure unique tag for each notification
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'complete',
        title: 'Mark Complete'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click: ', event);
  
  // Close the notification
  event.notification.close();
  
  // Get data from notification
  const userId = event.notification.data?.userId || 'anonymous';
  const reminderId = event.notification.data?.reminderId || null;
  const action = event.action;
  
  // Handle different actions
  let targetUrl = '/dashboard';
  
  if (action === 'view' && reminderId) {
    targetUrl = `/dashboard?reminder=${reminderId}`;
  } else if (action === 'complete' && reminderId) {
    targetUrl = `/dashboard?reminder=${reminderId}&action=complete`;
  }
  
  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle push event directly
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push received: ', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[firebase-messaging-sw.js] Push data: ', data);
      
      // Extract notification details
      const title = data.notification?.title || data.data?.title || 'Tempo Reminder';
      const body = data.notification?.body || data.data?.body || 'You have a new reminder';
      const userId = data.data?.userId || 'anonymous';
      const reminderId = data.data?.reminderId || null;
      
      // Show notification
      const notificationOptions = {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          ...data.data,
          userId: userId,
          reminderId: reminderId,
          timestamp: new Date().getTime(),
          url: '/dashboard'
        },
        tag: `tempo-notification-${userId}-${reminderId || Date.now()}`,
        actions: [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'complete',
            title: 'Mark Complete'
          }
        ]
      };
      
      event.waitUntil(
        self.registration.showNotification(title, notificationOptions)
      );
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error processing push data: ', error);
      
      // Show a generic notification if we can't parse the data
      event.waitUntil(
        self.registration.showNotification('Tempo Reminder', {
          body: 'You have a new notification',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        })
      );
    }
  }
});
