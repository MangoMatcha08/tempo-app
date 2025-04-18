
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Firestore } from 'firebase/firestore';
import { firebaseApp, getFirestoreInstance, handleFirestoreError } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isPermissionError, isQuotaError } from '@/lib/firebase/error-utils';

interface IndexNeeded {
  collectionId: string;
  url: string;
  detected: Date;
}

interface FirestoreContextType {
  db: Firestore | null;
  isReady: boolean;
  error: Error | null;
  isOnline: boolean;
  hasFirestorePermissions: boolean;
  useMockData: boolean;
  indexesNeeded: IndexNeeded[];
  registerNeededIndex: (collectionId: string, url: string) => void;
}

const FirestoreContext = createContext<FirestoreContextType>({
  db: null,
  isReady: false,
  error: null,
  isOnline: true,
  hasFirestorePermissions: true,
  useMockData: false,
  indexesNeeded: [],
  registerNeededIndex: () => {}
});

export const useFirestore = () => useContext(FirestoreContext);

export const FirestoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasFirestorePermissions, setHasFirestorePermissions] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [indexesNeeded, setIndexesNeeded] = useState<IndexNeeded[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const isTestAccount = useMemo(() => {
    if (!user) return false;
    return user.email === 'test@example.com';
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "You are now connected to the internet.",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "The app will continue to work with locally cached data.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    try {
      const firestoreDb = getFirestoreInstance();
      
      console.log('Firestore project ID:', firebaseApp?.options?.projectId || 'unknown');
      
      setDb(firestoreDb);
      setIsReady(true);
      setError(null);
      
      console.log('Firestore initialized successfully in context');
    } catch (err) {
      console.error('Error initializing Firestore in context:', err);
      setError(err instanceof Error ? err : new Error('Unknown Firestore error'));
      
      if (isPermissionError(err)) {
        console.warn('Firestore permissions issue detected');
        setHasFirestorePermissions(false);
        
        if (isTestAccount) {
          setUseMockData(true);
          toast({
            title: "Test Account Mode",
            description: "Using mock data for test account.",
            duration: 6000,
          });
        } else {
          toast({
            title: "Firestore Access Issue",
            description: "Firebase Firestore API may need to be enabled in your project.",
            duration: 6000,
            variant: "destructive"
          });
        }
      } else if (isQuotaError(err)) {
        console.warn('Firestore quota issue detected');
        toast({
          title: "Firebase Quota Exceeded",
          description: "Using locally cached data. Some features may be limited.",
          duration: 8000,
          variant: "destructive"
        });
        
        // Still try to initialize, we'll work with cached data
        try {
          const firestoreDb = getFirestoreInstance();
          setDb(firestoreDb);
          setIsReady(true);
        } catch (e) {
          // Critical error, can't even get instance
          console.error('Failed to get Firestore instance after quota error:', e);
        }
      }
      
      // Always try to get a backup instance even if we had an error
      try {
        const backupDb = getFirestoreInstance();
        setDb(backupDb);
      } catch (e) {
        console.error('Critical error getting Firestore instance:', e);
      }
    }
  }, [toast, isTestAccount]);

  // Register a new index that's needed
  const registerNeededIndex = (collectionId: string, url: string) => {
    // Check if we already have this index registered
    if (indexesNeeded.some(index => index.url === url)) {
      return; // Already registered
    }
    
    const newIndex = {
      collectionId,
      url,
      detected: new Date()
    };
    
    setIndexesNeeded(prev => [...prev, newIndex]);
    
    // Show a toast message with the index creation link
    toast({
      title: "Firestore Index Required",
      description: `An index is needed for ${collectionId}. Click the link in the console.`,
      duration: 8000,
    });
    
    // Log the URL to make it clickable in the console
    console.info(`Create Firestore index: ${url}`);
  };

  const contextValue = useMemo(() => ({
    db,
    isReady,
    error,
    isOnline,
    hasFirestorePermissions,
    useMockData,
    indexesNeeded,
    registerNeededIndex
  }), [db, isReady, error, isOnline, hasFirestorePermissions, useMockData, indexesNeeded]);

  return (
    <FirestoreContext.Provider value={contextValue}>
      {children}
    </FirestoreContext.Provider>
  );
};
