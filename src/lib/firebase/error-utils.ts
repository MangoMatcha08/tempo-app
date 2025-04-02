
/**
 * Utility functions for handling Firebase errors
 */

// Check if an error is related to Firestore quota limits
export const isQuotaError = (err: any): boolean => {
  if (!err) return false;
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || String(err);
    
  return (
    errorMessage.includes('quota') && 
    errorMessage.includes('exceeded')
  );
};

// Check for permission denied errors
export const isPermissionError = (err: any): boolean => {
  if (!err) return false;
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || String(err);
    
  return (
    errorMessage.includes('permission-denied') || 
    errorMessage.includes('not been used') || 
    errorMessage.includes('disabled')
  );
};

// Check for index-related errors
export const isIndexError = (err: any): boolean => {
  if (!err) return false;
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || String(err);
    
  return (
    (errorMessage.includes('index') && errorMessage.includes('required')) || 
    (errorMessage.includes('index') && errorMessage.includes('requires')) ||
    errorMessage.includes('9 FAILED_PRECONDITION') ||
    errorMessage.includes('missing index') ||
    (errorMessage.includes('FAILED_PRECONDITION') && errorMessage.includes('index'))
  );
};

// Check for network connectivity errors
export const isNetworkError = (err: any): boolean => {
  if (!err) return false;
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || String(err);
    
  return (
    errorMessage.includes('network') || 
    errorMessage.includes('offline') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('UNAVAILABLE')
  );
};

// Check for authentication errors
export const isAuthError = (err: any): boolean => {
  if (!err) return false;
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || String(err);
    
  return (
    errorMessage.includes('auth/') || 
    errorMessage.includes('unauthenticated') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('UNAUTHENTICATED')
  );
};

// Extract user-friendly error message from Firebase error
export const getUserFriendlyErrorMessage = (err: any): string => {
  if (!err) return "An unknown error occurred";
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || String(err);
  
  if (isQuotaError(err)) {
    return "Firebase quota limit exceeded. Please try again later.";
  }
  
  if (isPermissionError(err)) {
    return "You don't have permission to perform this action.";
  }
  
  if (isIndexError(err)) {
    return "Database index is required for this operation.";
  }
  
  if (isNetworkError(err)) {
    return "Network connection issue. Please check your internet connection.";
  }
  
  if (isAuthError(err)) {
    if (errorMessage.includes('auth/user-not-found')) {
      return "User not found. Please check your email or sign up.";
    }
    if (errorMessage.includes('auth/wrong-password')) {
      return "Incorrect password. Please try again.";
    }
    if (errorMessage.includes('auth/email-already-in-use')) {
      return "Email already in use. Please use a different email or sign in.";
    }
    if (errorMessage.includes('auth/invalid-email')) {
      return "Invalid email format. Please enter a valid email.";
    }
    if (errorMessage.includes('auth/weak-password')) {
      return "Password is too weak. Please use a stronger password.";
    }
    if (errorMessage.includes('auth/requires-recent-login')) {
      return "This action requires recent authentication. Please sign in again.";
    }
    return "Authentication error. Please sign in again.";
  }
  
  // Default error message
  return "An error occurred. Please try again later.";
};
