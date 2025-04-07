
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

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'TempoWizard Reminder';
  const notificationOptions = {
    body: payload.notification.body || 'You have an upcoming reminder',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click: ', event);
  
  event.notification.close();
  
  // Get notification data
  const reminderId = event.notification.data?.reminderId || '';
  
  // Open a window with the reminder detail if available
  const urlToOpen = new URL('/dashboard', self.location.origin).href;
  
  const openPromise = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Check if there is an existing open window
    for (const client of clientList) {
      if (client.url.includes('/dashboard') && 'focus' in client) {
        return client.focus();
      }
    }
    // If no existing window, open a new one
    return self.clients.openWindow(urlToOpen);
  });
  
  event.waitUntil(openPromise);
});
