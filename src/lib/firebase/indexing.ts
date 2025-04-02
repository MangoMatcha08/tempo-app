
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

// Helper to detect if there's a missing index error
export const isMissingIndexError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || String(error);
    
  return (
    (errorMessage.includes('index') && errorMessage.includes('required')) || 
    errorMessage.includes('9 FAILED_PRECONDITION') ||
    errorMessage.includes('missing index') ||
    (errorMessage.includes('FAILED_PRECONDITION') && errorMessage.includes('index'))
  );
};

// Parse Firestore error to extract required index fields
export const parseIndexRequiredError = (error: any): string[] | null => {
  if (!error) return null;
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || String(error);
  
  // Try to extract the field paths from the error message
  try {
    // This pattern looks for text between "for collection group" and the end
    const matchCollection = errorMessage.match(/for collection group \[([^\]]+)\]/);
    if (!matchCollection) return null;
    
    // Try to find the fields pattern which usually comes after "with composite index"
    const fieldsPattern = /composite index \[(.*?)\]/;
    const fieldsMatch = errorMessage.match(fieldsPattern);
    
    if (fieldsMatch && fieldsMatch[1]) {
      // Parse the field paths from the error message
      return fieldsMatch[1].split(',').map(field => field.trim());
    }
  } catch (e) {
    console.error("Error parsing index fields from error:", e);
  }
  
  return null;
};

