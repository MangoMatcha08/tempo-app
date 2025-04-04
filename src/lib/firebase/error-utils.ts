
/**
 * Utility functions for handling Firebase errors
 */

/**
 * Check if an error is related to Firestore permissions
 */
export const isPermissionError = (err: any): boolean => {
  if (!err) return false;
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || err.code || String(err);
    
  return (
    errorMessage.includes('permission-denied') || 
    errorMessage.includes('not been used') ||
    errorMessage.includes('disabled') ||
    errorMessage.includes('requires valid authentication')
  );
};

/**
 * Check if an error is related to quota limits
 */
export const isQuotaError = (err: any): boolean => {
  if (!err) return false;
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || err.code || String(err);
    
  return (
    errorMessage.includes('quota') && 
    errorMessage.includes('exceeded') ||
    errorMessage.includes('resource-exhausted') ||
    errorMessage.includes('limit reached')
  );
};

/**
 * Check if an error is related to missing indexes
 */
export const isIndexError = (err: any): boolean => {
  if (!err) return false;
  
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || err.code || String(err);
    
  return (
    errorMessage.includes('missing index') ||
    errorMessage.includes('no matching index')
  );
};

/**
 * Get a user-friendly error message for common Firebase errors
 */
export const getUserFriendlyErrorMessage = (err: any): string => {
  if (!err) return "An unknown error occurred.";
  
  // Extract error message
  const errorMessage = typeof err === 'string' 
    ? err 
    : err.message || err.code || String(err);
    
  // Handle permission errors
  if (isPermissionError(err)) {
    return "You don't have permission to access this data. Please check your account settings.";
  }
  
  // Handle quota errors
  if (isQuotaError(err)) {
    return "The service is temporarily unavailable due to high demand. Your data will be available from cache. Please try again later.";
  }
  
  // Handle index errors
  if (isIndexError(err)) {
    return "There was a database configuration issue. We're working on optimizing your queries.";
  }
  
  // Handle network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('offline')
  ) {
    return "Network error. Please check your internet connection and try again.";
  }
  
  // Handle timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return "The operation timed out. Please try again later.";
  }
  
  // Fallback error message
  return "There was an issue retrieving your data. Please try refreshing.";
};
