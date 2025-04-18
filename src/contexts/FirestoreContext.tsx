
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Firestore } from 'firebase/firestore';
import { firebaseApp, getFirestoreInstance } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isPermissionError, isQuotaError, isIndexError } from '@/lib/firebase/error-utils';
import { 
  isMissingIndexError, 
  getFirestoreIndexCreationUrl, 
  handleFirestoreIndexError 
} from '@/lib/firebase/indexing';
import { ToastAction } from '@/components/ui/toast';

interface FirestoreContextType {
  db: Firestore | null;
  isReady: boolean;
  error: Error | null;
  isOnline: boolean;
  hasFirestorePermissions: boolean;
  useMockData: boolean;
  indexesNeeded: Record<string, boolean>;
  registerNeededIndex: (collectionId: string, fields: string[]) => void;
}

const FirestoreContext = createContext<FirestoreContextType>({
  db: null,
  isReady: false,
  error: null,
  isOnline: true,
  hasFirestorePermissions: true,
  useMockData: false,
  indexesNeeded: {},
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
  const [indexesNeeded, setIndexesNeeded] = useState<Record<string, boolean>>({});
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
      
      // Enhanced error handling with index detection
      const indexErrorDetails = handleFirestoreIndexError(err);
      
      if (indexErrorDetails.isIndexError) {
        console.warn('Firestore index issue detected');
        
        toast({
          title: "Firestore Index Required",
          description: "Create the necessary indexes to optimize database queries.",
          action: indexErrorDetails.indexUrl ? (
            <ToastAction 
              altText="Create Index"
              onClick={() => window.open(indexErrorDetails.indexUrl!, '_blank')}
            >
              Create Index
            </ToastAction>
          ) : undefined,
          duration: 8000,
        });
      }
      
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
        
      } else if (isIndexError(err)) {
        console.warn('Firestore index issue detected');
        toast({
          title: "Firestore Index Required",
          description: "Create the necessary indexes in the Firebase Console.",
          duration: 8000,
        });
        
        setDb(getFirestoreInstance());
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

  const registerNeededIndex = (collectionId: string, fields: string[]) => {
    setIndexesNeeded(prev => ({ ...prev, [collectionId]: true }));
    
    const indexUrl = getFirestoreIndexCreationUrl(collectionId, fields);
    if (indexUrl) {
      console.info(`Create index at: ${indexUrl}`);
      toast({
        title: "Firestore Index Required",
        description: `Create the necessary index for ${collectionId} collection to improve performance.`,
        action: (
          <ToastAction 
            altText="Create Index" 
            onClick={() => window.open(indexUrl, '_blank')}
          >
            Create Index
          </ToastAction>
        ),
        duration: 8000,
      });
    }
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
