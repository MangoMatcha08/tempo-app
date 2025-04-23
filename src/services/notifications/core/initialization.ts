
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFirestoreInstance } from '@/lib/firebase/firestore';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';

// Firebase configuration
export const firebaseConfig = {
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

// Singleton instances
let messaging: any = null;
let firestore: any = null;
let app: any = null;
let isInitialized = false;

export const initializeFirebase = async () => {
  if (isInitialized) return { messaging, firestore };
  
  if (typeof window !== 'undefined') {
    try {
      console.log('Initializing Firebase...');
      app = initializeApp(firebaseConfig);
      
      const supported = await isSupported();
      if (supported) {
        messaging = getMessaging(app);
        console.log('Firebase messaging initialized');
      } else {
        console.log('Firebase messaging not supported in this browser');
      }
      
      firestore = getFirestoreInstance();
      console.log('Firebase Firestore initialized');
      
      isInitialized = true;
      
      await registerServiceWorker();
      
      return { messaging, firestore };
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return { messaging: null, firestore: null };
    }
  }
  
  return { messaging: null, firestore: null };
};

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-start', { 
        isIOS: true, 
        iosSafari: browserDetection.isIOSSafari() 
      });
    }
    
    const swOptions = browserDetection.isIOS() ? { scope: '/' } : undefined;
    const existingSW = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    
    if (!existingSW) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', swOptions);
      console.log('Service worker registered:', registration);
      
      if (browserDetection.isIOS()) {
        iosPushLogger.logServiceWorkerEvent('registration-success', {
          scope: registration.scope,
          updateViaCache: registration.updateViaCache
        });
      }
    }
  } catch (error) {
    console.error('Service worker registration failed:', error);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-failed', { 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
};

export { messaging, firestore, app };
