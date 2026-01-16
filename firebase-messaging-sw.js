/**
 * Firebase Cloud Messaging Service Worker
 * 
 * This service worker is responsible for handling messages from Firebase
 * when the app is in the background or closed.
 * 
 * IMPORTANT: This file must be at the root level (or configured in manifest.json)
 * Firebase will look for this specific service worker for messaging.
 */

// Import Firebase scripts (must be global importScripts)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker context
const firebaseConfig = {
  apiKey: "AIzaSyD27SHH096KUpTNTp2K7kViRELHD6ALHH8",
  authDomain: "subtra-da8c1.firebaseapp.com",
  projectId: "subtra-da8c1",
  storageBucket: "subtra-da8c1.appspot.com",
  messagingSenderId: "795601435114",
  appId: "1:795601435114:web:aaa12d19869dc00a5dda93"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

/**
 * Handle notification when app is in background or closed
 * This event is triggered when a message is received while the app is backgrounded
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[Background Message received]', payload);

  // Extract notification data
  const notificationTitle = payload.notification?.title || 'Subtra Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.notification?.tag || 'notification-tag',
    requireInteraction: payload.notification?.requireInteraction || false,
    // Custom data can be passed and accessed
    data: {
      url: payload.notification?.clickAction || '/',
      ...payload.data
    },
    // Android specific options
    vibrate: [200, 100, 200],
    // Add custom action buttons if needed
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click events
 * Triggered when user clicks on the notification
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Notification click]', event);

  // Remove the notification after click
  event.notification.close();

  // Get the URL to open (from custom data or default to home)
  const urlToOpen = event.notification.data?.url || '/';

  // Check if we should open or close based on action
  if (event.action === 'close') {
    return;
  }

  // Find or open the app window
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Handle notification close events
 * Optional: Track when users dismiss notifications
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[Notification closed]', event);
  // You can send analytics here if needed
});

/**
 * Handle service worker messages
 * Allows the main app to communicate with the service worker
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker message]', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Clear old cache on activation
 * Ensures fresh content is always served
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker activated]');
  event.waitUntil(self.clients.claim());
});

console.log('✓ Firebase Messaging Service Worker initialized');
