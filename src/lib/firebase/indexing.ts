
import { firebaseApp } from "./config";

// Function to help generate the correct index creation URL
export const getFirestoreIndexCreationUrl = (collectionId: string, fields: string[]) => {
  if (!firebaseApp?.options?.projectId) {
    return null;
  }
  
  const projectId = firebaseApp.options.projectId;
  const encodedFields = encodeURIComponent(JSON.stringify(fields));
  
  return `https://console.firebase.google.com/project/${projectId}/firestore/indexes?create_composite=${encodedFields}&collection=${collectionId}`;
};

// Helper to detect if there's a missing index
export const isMissingIndexError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || String(error);
    
  return (
    (errorMessage.includes('index') && 
    (errorMessage.includes('required') || errorMessage.includes('needs'))) || 
    errorMessage.includes('9 FAILED_PRECONDITION') ||
    errorMessage.includes('FAILED_PRECONDITION: The query requires an index')
  );
};

// Extract index URL from error message if available
export const extractIndexUrlFromError = (errorMessage: string): string | null => {
  if (!errorMessage) return null;
  
  if (errorMessage.includes('https://console.firebase.google.com')) {
    try {
      const url = errorMessage.substring(
        errorMessage.indexOf('https://console.firebase.google.com'),
        errorMessage.length
      );
      
      // Clean up any trailing characters
      if (url.includes('\n')) {
        return url.substring(0, url.indexOf('\n'));
      }
      
      return url;
    } catch (e) {
      console.error('Error extracting index URL:', e);
    }
  }
  
  return null;
};

// Parse fields from an error message
export const parseFieldsFromError = (errorMessage: string): string[] | null => {
  if (!errorMessage) return null;
  
  // Try to find the field list in the error message
  try {
    // Look for common patterns in Firestore index error messages
    const fieldPattern = /for collection group \[(.*?)\] with indexes: \[(.*?)\]/;
    const matches = errorMessage.match(fieldPattern);
    
    if (matches && matches.length >= 3) {
      // The second capture group should have the field paths
      const fieldString = matches[2];
      return fieldString.split(',').map(f => f.trim());
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing fields from error message:', e);
    return null;
  }
};

// Helper to create a recovery query that won't require an index
export const getRecoveryQuery = (collectionPath: string, userId: string) => {
  return {
    path: collectionPath,
    filters: [
      {
        fieldPath: 'userId',
        opStr: '==',
        value: userId
      }
    ],
    // No orderBy - client will sort results
    orderByFields: []
  };
};
