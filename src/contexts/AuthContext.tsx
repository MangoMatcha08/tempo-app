
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { 
  onAuthStateChange, 
  isFirebaseInitialized, 
  getFirebaseInitError,
  pingFirebase
} from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  firebaseReady: boolean;
  verifyConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  firebaseReady: false,
  verifyConnection: async () => false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  
  const verifyConnection = async () => {
    try {
      console.log("Verifying Firebase connection...");
      const { success, error } = await pingFirebase();
      
      if (!success) {
        console.error("Firebase connection verification failed:", error);
        setError(error || new Error("Failed to connect to Firebase"));
        
        toast({
          title: "Connection failed",
          description: "Could not connect to authentication service. Please try again later.",
          variant: "destructive",
          duration: 8000,
        });
        
        return false;
      }
      
      console.log("Firebase connection verified successfully");
      return true;
    } catch (err) {
      console.error("Unexpected error during connection verification:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      toast({
        title: "Connection error",
        description: "An unexpected error occurred while connecting to the authentication service.",
        variant: "destructive",
        duration: 8000,
      });
      
      return false;
    }
  };
  
  useEffect(() => {
    console.log("Setting up Firebase initialization");
    const firebaseInitialized = isFirebaseInitialized();
    const firebaseError = getFirebaseInitError();
    
    setFirebaseReady(firebaseInitialized);
    
    if (!firebaseInitialized) {
      console.error("Firebase not initialized:", firebaseError);
      setError(firebaseError || new Error("Firebase initialization failed"));
      setLoading(false);
      
      toast({
        title: "Service unavailable",
        description: "Authentication service is temporarily unavailable. Please try again later.",
        variant: "destructive",
        duration: 8000,
      });
    } else {
      console.log("Firebase initialized, verifying connection");
      verifyConnection();
    }
  }, []);
  
  useEffect(() => {
    if (!firebaseReady) {
      console.log("Firebase not ready, skipping auth state listener setup");
      return () => {};
    }
    
    console.log("Setting up auth state listener");
    let unsubscribe = () => {};
    
    try {
      unsubscribe = onAuthStateChange((user) => {
        console.log("Auth state changed, user:", user?.email || "none");
        setUser(user);
        setLoading(false);
        
        if (user) {
          console.log("User authenticated:", user.email);
          // Log provider data for debugging
          if (user.providerData && user.providerData.length > 0) {
            console.log("Auth provider:", user.providerData[0].providerId);
          }
        } else {
          console.log("No authenticated user");
        }
      });
    } catch (err) {
      console.error("Error in auth state change setup:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
    
    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, [firebaseReady]);

  return (
    <AuthContext.Provider value={{ user, loading, error, firebaseReady, verifyConnection }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
