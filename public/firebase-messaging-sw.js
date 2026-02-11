// Firebase Cloud Messaging Service Worker
// This handles background notifications when the app is not open

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyByuz0f9tORPRb9iTA6M1oaw3UsN-dNQgA",
  authDomain: "letsdoit-2026.firebaseapp.com",
  projectId: "letsdoit-2026",
  storageBucket: "letsdoit-2026.firebasestorage.app",
  messagingSenderId: "436174401280",
  appId: "1:436174401280:web:05fbe5d23aad9cf7d84de5"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
