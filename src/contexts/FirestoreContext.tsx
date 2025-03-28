
import { createContext, useContext, ReactNode } from "react";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { isFirebaseInitialized } from "@/lib/firebase";

interface FirestoreContextType {
  isReady: boolean;
}

const FirestoreContext = createContext<FirestoreContextType>({
  isReady: false
});

export const FirestoreProvider = ({ children }: { children: ReactNode }) => {
  const isReady = isFirebaseInitialized();
  
  return (
    <FirestoreContext.Provider value={{ isReady }}>
      {children}
    </FirestoreContext.Provider>
  );
};

export const useFirestore = () => useContext(FirestoreContext);
