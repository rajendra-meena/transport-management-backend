import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth } from './api';

const firebaseConfig = {
  apiKey: 'AIzaSyC_ADmrrxdDCp8X-WXPqfeyK8GN2uEBgZ8',
  authDomain: 'transport-management-cb902.firebaseapp.com',
  projectId: 'transport-management-cb902',
  storageBucket: 'transport-management-cb902.firebasestorage.app',
  messagingSenderId: '524407495701',
  appId: '1:524407495701:web:0c802e80ed1adc0f8fc21c'
};

const VAPID_KEY = 'BLKt9mAdpyV-1r_ru77adjaqoSCH1_9qHUKjd4SEmtvMCopgS-OBRKlKcj8N9uLmV_ncg9IxnnFzTldLvOcYJkI';
let messaging;

try {
  messaging = getMessaging(initializeApp(firebaseConfig));
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export async function requestPermissionAndGetToken() {
  if (!messaging || !('Notification' in window) || !('serviceWorker' in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (currentToken && localStorage.getItem('authToken')) {
    await auth.saveFcmToken(currentToken);
  }
}

export function listenForMessages() {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    if (payload.notification && Notification.permission === 'granted') {
      new Notification(payload.notification.title || 'Notification', {
        body: payload.notification.body || '',
        icon: '/src/favicon.ico'
      });
    }
  });
}
