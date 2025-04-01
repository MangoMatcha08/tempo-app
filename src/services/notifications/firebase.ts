
// Firebase initialization and configuration
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';

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

// Safely initialize Firebase only in browser environment
export const initializeFirebase = async () => {
  if (firebaseInitialized) return { messaging, firestore };
  
  if (typeof window !== 'undefined') {
    try {
      const app = initializeApp(firebaseConfig);
      
      // Check if messaging is supported
      const supported = await isSupported();
      if (supported) {
        messaging = getMessaging(app);
        console.log('Firebase messaging initialized');
      } else {
        console.log('Firebase messaging not supported in this browser');
      }
      
      firestore = getFirestore(app);
      firebaseInitialized = true;
      
      return { messaging, firestore };
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return { messaging: null, firestore: null };
    }
  }
  
  return { messaging: null, firestore: null };
};

// Initialize Firebase when this module is loaded
initializeFirebase().catch(err => console.error('Failed to initialize Firebase:', err));

export { messaging, firestore };
