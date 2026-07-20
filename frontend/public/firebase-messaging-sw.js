// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyC_ADmrrxdDCp8X-WXPqfeyK8GN2uEBgZ8',
  authDomain: 'transport-management-cb902.firebaseapp.com',
  projectId: 'transport-management-cb902',
  storageBucket: 'transport-management-cb902.firebasestorage.app',
  messagingSenderId: '524407495701',
  appId: '1:524407495701:web:0c802e80ed1adc0f8fc21c'
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    const isFocused = windowClients.some((client) => client.focused);
    if (!isFocused) {
      self.registration.showNotification(
        payload.notification?.title || payload.data?.title || 'Transport Management System',
        {
          body: payload.notification?.body || payload.data?.body || 'New update received.',
          icon: '/src/favicon.ico',
          data: payload.data
        }
      );
    }
  });
});
