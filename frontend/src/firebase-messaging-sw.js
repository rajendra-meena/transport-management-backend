// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC_ADmrrxdDCp8X-WXPqfeyK8GN2uEBgZ8",
  authDomain: "transport-management-cb902.firebaseapp.com",
  projectId: "transport-management-cb902",
  storageBucket: "transport-management-cb902.firebasestorage.app",
  messagingSenderId: "524407495701",
  appId: "1:524407495701:web:0c802e80ed1adc0f8fc21c"
};

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Customize background notification handling
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  // Get all window clients of this application
  self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if any tab is currently focused/active
    const isFocused = windowClients.some(client => client.focused);
    
    if (!isFocused) {
      // Show notification only if the application is in the background
      const notificationTitle = payload.notification?.title || payload.data?.title || 'Transport Management System';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'New update received.',
        icon: '/assets/favicon.ico', // fallback icon
        data: payload.data
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    } else {
      console.log('App is in foreground. Skipping background service worker notification.');
    }
  });
});
