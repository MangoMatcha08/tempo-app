
import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { isFirebaseInitialized } from "@/lib/firebase";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  Firestore, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { ScheduleProvider } from "./ScheduleContext";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/services/notifications/firebase";

interface FirestoreContextType {
  isReady: boolean;
  db: Firestore | null;
  error: Error | null;
}

const FirestoreContext = createContext<FirestoreContextType>({
  isReady: false,
  db: null,
  error: null
});

export const FirestoreProvider = ({ children }: { children: ReactNode }) => {
  const isReady = isFirebaseInitialized();
  const [db, setDb] = useState<Firestore | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Initialize Firestore with optimized persistent cache
  useEffect(() => {
    if (!isReady) return;
    
    const initFirestore = async () => {
      try {
        console.log("Initializing Firestore...");
        
        // Initialize Firestore with modern optimized settings
        let firestore: Firestore;
        
        try {
          // Use modern persistent cache with multi-tab support
          firestore = initializeFirestore(app, {
            cacheSizeBytes: CACHE_SIZE_UNLIMITED,
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager()
            })
          });
          console.log("Initialized Firestore with optimized persistent cache");
          
          // No need to call enableIndexedDbPersistence with the new approach
          // as it's handled by persistentLocalCache
        } catch (err) {
          console.warn("Could not initialize with enhanced settings, falling back:", err);
          
          firestore = getFirestore(app);
          
          // Try to enable persistence with older method
          try {
            await enableIndexedDbPersistence(firestore);
            console.log("Firestore persistence enabled with fallback method");
          } catch (persistErr: any) {
            if (persistErr.code === 'failed-precondition') {
              console.warn("Multiple tabs open, persistence can only be enabled in one tab");
              // This is not a fatal error, we can continue
            } else if (persistErr.code === 'unimplemented') {
              console.warn("Persistence not available in this browser");
              // This is not a fatal error, we can continue
            } else {
              console.error("Error enabling persistence:", persistErr);
              setError(persistErr);
            }
          }
        }
        
        // Set the database instance even if there were non-fatal errors with persistence
        setDb(firestore);
        console.log("Firestore initialized successfully");
      } catch (error: any) {
        console.error("Error initializing Firestore:", error);
        setError(error);
        toast({
          title: "Database Error",
          description: "Failed to initialize the database. Some features may not work correctly.",
          variant: "destructive",
        });
      }
    };
    
    initFirestore();
  }, [isReady, toast]);
  
  return (
    <FirestoreContext.Provider value={{ isReady, db, error }}>
      <ScheduleProvider>
        {children}
      </ScheduleProvider>
    </FirestoreContext.Provider>
  );
};

export const useFirestore = () => useContext(FirestoreContext);
