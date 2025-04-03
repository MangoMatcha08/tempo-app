// Firebase initialization and configuration
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported, onMessage } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("FirebaseService");

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

// FCM Vapid Key
export const vapidKey = 'BJ9HWzAxfk1jKtkGfoKYMauaVfMatIkqw0cCEwQ1WBH7cn5evFO_saWfpvXAVy5710DTOpSUoXsKk8LWGQK7lBU';

// Initialize Firebase
let messaging: any = null;
let firestore: any = null;
let firebaseInitialized = false;
let app: any = null;

// Safely initialize Firebase only in browser environment
export const initializeFirebase = async () => {
  if (firebaseInitialized) return { messaging, firestore };
  
  if (typeof window !== 'undefined') {
    try {
      debugLog('Initializing Firebase...');
      app = initializeApp(firebaseConfig);
      
      // Check if messaging is supported
      const supported = await isSupported();
      if (supported) {
        try {
          messaging = getMessaging(app);
          debugLog('Firebase messaging initialized');
        } catch (messagingError) {
          console.error('Error initializing Firebase messaging:', messagingError);
          debugLog(`Error initializing Firebase messaging: ${messagingError}`);
          messaging = null;
        }
      } else {
        debugLog('Firebase messaging not supported in this browser');
      }
      
      // Initialize Firestore
      try {
        firestore = getFirestore(app);
        debugLog('Firebase Firestore initialized');
      } catch (firestoreError) {
        console.error('Error initializing Firestore:', firestoreError);
        debugLog(`Error initializing Firestore: ${firestoreError}`);
        firestore = null;
      }
      
      firebaseInitialized = true;
      
      // Register service worker for push if not already registered
      if ('serviceWorker' in navigator) {
        try {
          const existingSW = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          if (!existingSW) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/'
            });
            debugLog('Service worker registered:', registration);
          } else {
            debugLog('Existing service worker found');
          }
        } catch (swError) {
          console.error('Service worker registration failed:', swError);
          debugLog(`Service worker registration failed: ${swError}`);
        }
      }
      
      return { messaging, firestore };
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      debugLog(`Error initializing Firebase: ${error}`);
      return { messaging: null, firestore: null };
    }
  }
  
  return { messaging: null, firestore: null };
};

// Check if running on iOS device
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
};

// Check if running on Android device
export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};

// Check if running in standalone PWA mode
export const isPWAMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true || 
         document.referrer.includes('android-app://');
};

// Initialize Firebase when this module is loaded
initializeFirebase().catch(err => console.error('Failed to initialize Firebase:', err));

export { messaging, firestore, app };
