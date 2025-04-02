
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from "firebase/auth";
import { firebaseApp } from "./config";

// Auth instance and provider setup
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Add scopes for Google provider (optional but recommended for more data)
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Set custom parameters for a better UX
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth state change listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Sign in with email failed:", error);
    return { user: null, error };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name
      });
    }
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Sign up with email failed:", error);
    return { user: null, error };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign in process...");
    const userCredential = await signInWithPopup(auth, googleProvider);
    console.log("Google sign in successful:", userCredential.user?.email);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Sign in with Google failed:", error);
    // Log detailed error information for debugging
    if ('code' in error) {
      console.error("Error code:", error.code);
    }
    if ('message' in error) {
      console.error("Error message:", error.message);
    }
    if ('customData' in error) {
      console.error("Error custom data:", error.customData);
    }
    return { user: null, error };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error("Sign out failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
};

export { auth };
