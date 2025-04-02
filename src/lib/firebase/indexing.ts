
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
    
  return errorMessage.includes('index') && 
    errorMessage.includes('required') || 
    errorMessage.includes('9 FAILED_PRECONDITION');
};
