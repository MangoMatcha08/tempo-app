
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../core/initialization';
import { defaultNotificationSettings } from '@/types/notifications/settingsTypes';

export const saveTokenToFirestore = async (token: string): Promise<void> => {
  if (!firestore) return;
  
  const auth = getAuth();
  if (!auth.currentUser) {
    console.error('Attempted to save token without authentication');
    return;
  }

  const userId = auth.currentUser.uid;
  
  try {
    console.log(`Saving token for authenticated user ${userId}`);
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const fcmTokens = userDoc.data().fcmTokens || {};
      fcmTokens[token] = true;
      
      await updateDoc(userDocRef, {
        fcmTokens,
        updatedAt: new Date()
      });
      console.log('Updated existing user document with token');
    } else {
      await setDoc(userDocRef, {
        fcmTokens: { [token]: true },
        notificationSettings: defaultNotificationSettings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created new user document with token');
    }
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
  }
};
