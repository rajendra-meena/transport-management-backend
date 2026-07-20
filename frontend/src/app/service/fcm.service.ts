import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// TODO: Replace these placeholders with your actual Firebase Web App configurations
const firebaseConfig = {
  apiKey: "AIzaSyC_ADmrrxdDCp8X-WXPqfeyK8GN2uEBgZ8",
  authDomain: "transport-management-cb902.firebaseapp.com",
  projectId: "transport-management-cb902",
  storageBucket: "transport-management-cb902.firebasestorage.app",
  messagingSenderId: "524407495701",
  appId: "1:524407495701:web:0c802e80ed1adc0f8fc21c"
};

// TODO: Replace with your actual Firebase Cloud Messaging VAPID public key
const VAPID_KEY = "BLKt9mAdpyV-1r_ru77adjaqoSCH1_9qHUKjd4SEmtvMCopgS-OBRKlKcj8N9uLmV_ncg9IxnnFzTldLvOcYJkI";

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private messaging: any;
  private baseUrl = 'http://localhost:5000/api/v1';

  constructor(private http: HttpClient) {
    try {
      // Initialize Firebase App
      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);
      console.log('Firebase App initialized successfully in FcmService.');
    } catch (error) {
      console.error('Failed to initialize Firebase App:', error);
    }
  }

  /**
   * Request notification permissions and register token with backend if logged in
   */
  requestPermissionAndGetToken(): void {
    if (!this.messaging) {
      console.warn('Firebase Messaging is not initialized.');
      return;
    }

    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications.');
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        
        // Explicitly register the service worker to make sure it loads
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((registration) => {
              console.log('Service Worker registered successfully for FCM:', registration);
              
              // Get FCM token
              getToken(this.messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
              }).then((currentToken) => {
                if (currentToken) {
                  console.log('FCM Device Token retrieved:', currentToken);
                  this.saveTokenToBackend(currentToken);
                } else {
                  console.log('No FCM token available. Request permission to generate one.');
                }
              }).catch((err) => {
                console.error('Error occurred while retrieving FCM token:', err);
              });
            })
            .catch((err) => {
              console.error('Service Worker registration failed for FCM:', err);
            });
        }
      } else {
        console.warn('Notification permission denied or dismissed.');
      }
    });
  }

  /**
   * Send the FCM token to the backend
   */
  private saveTokenToBackend(token: string): void {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('User is not logged in. Postponing FCM token update to backend.');
      return;
    }

    this.http.put(`${this.baseUrl}/auth/fcm-token`, { fcmToken: token }).subscribe({
      next: (res: any) => {
        console.log('FCM token registered successfully on the backend:', res);
      },
      error: (err) => {
        console.error('Failed to register FCM token on the backend:', err);
      }
    });
  }

  /**
   * Listen for incoming messages while the app is in the foreground
   */
  listenForMessages(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('FCM Message received in foreground:', payload);
      
      // Try to show browser native notification in foreground
      if (payload.notification) {
        this.showBrowserNotification(
          payload.notification.title || 'Notification',
          payload.notification.body || ''
        );
      }
    });
  }

  /**
   * Show a browser notification (useful for foreground messages)
   */
  private showBrowserNotification(title: string, body: string): void {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/assets/favicon.ico'
        });
      } catch (e) {
        // Fallback for browsers that don't support new Notification inside client context
        console.log('Notification API fallback. Title:', title, 'Body:', body);
      }
    }
  }
}
