/* eslint-disable no-restricted-globals */
// Firebase Cloud Messaging Service Worker
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM',
  authDomain: 'flicklet-71dff.firebaseapp.com',
  projectId: 'flicklet-71dff',
  storageBucket: 'flicklet-71dff.appspot.com',
  messagingSenderId: '1034923556763',
  appId: '1:1034923556763:web:bba5489cd1d9412c9c2b3e',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'New notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  if (data?.postSlug) {
    event.waitUntil(
      clients.openWindow(`/posts/${data.postSlug}`)
    );
  }
});

