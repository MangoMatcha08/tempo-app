
// Firebase Cloud Messaging service worker
// This file must be placed at the root of your app's public directory

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
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'Tempo Reminder';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new reminder',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      ...payload.data,
      userId: userId, // Include user ID in notification data
      timestamp: new Date().getTime()
    },
    tag: `tempo-notification-${userId}-${Date.now()}` // Ensure unique tag for each notification
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click: ', event);
  
  event.notification.close();
  
  // Get user ID from notification data
  const userId = event.notification.data?.userId || 'anonymous';
  
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
        return clients.openWindow('/dashboard');
      }
    })
  );
});
