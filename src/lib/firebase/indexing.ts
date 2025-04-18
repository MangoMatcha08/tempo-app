import { firebaseApp } from "./config";

// Helper to detect if there's a missing index error
export const isMissingIndexError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || String(error);
    
  return (
    errorMessage.includes('index') && 
    (errorMessage.includes('required') || 
    errorMessage.includes('FAILED_PRECONDITION') ||
    errorMessage.includes('missing index'))
  );
};

// Function to help generate the correct index creation URL
export const getFirestoreIndexCreationUrl = (collectionId: string, fields: string[]) => {
  if (!firebaseApp?.options?.projectId) {
    return null;
  }
  
  const projectId = firebaseApp.options.projectId;
  
  // Check if the URL is already provided in the error message
  if (fields.length === 1 && fields[0].startsWith('https://')) {
    return fields[0];
  }
  
  // For fields defined normally, generate a proper URL
  let fieldParams;
  try {
    const formattedFields = fields.map((field, index) => {
      // Simple format for fields with just path
      if (typeof field === 'string') {
        return {
          fieldPath: field,
          order: index === fields.length - 1 ? "DESCENDING" : "ASCENDING" 
        };
      }
      // It's already an object with fieldPath and order
      return field;
    });
    
    fieldParams = encodeURIComponent(JSON.stringify(formattedFields));
  } catch (error) {
    console.error("Error formatting fields for index URL:", error);
    fieldParams = encodeURIComponent(JSON.stringify(fields.map(f => ({ 
      fieldPath: String(f),
      order: "ASCENDING" 
    }))));
  }
  
  return `https://console.firebase.google.com/project/${projectId}/firestore/indexes?create_composite=${fieldParams}&collection=${collectionId}`;
};

// Export a dedicated error handling function for index-related errors
export const handleFirestoreIndexError = (error: any): { 
  isIndexError: boolean; 
  indexUrl?: string | null;
  fields?: string[];
} => {
  if (!isMissingIndexError(error)) {
    return { isIndexError: false };
  }
  
  // Try to extract the URL directly from the error message
  const errorMessage = typeof error === 'string' ? error : error.message || String(error);
  const urlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com\/[^\s"')]+/);
  const directUrl = urlMatch ? urlMatch[0] : null;
  
  // If we have a direct URL, use it
  if (directUrl) {
    return {
      isIndexError: true,
      indexUrl: directUrl,
      fields: [directUrl] // Store the URL itself as a field for future reference
    };
  }
  
  // Otherwise try to parse fields from the error
  const parsedFields = parseIndexRequiredError(error);
  if (parsedFields) {
    const urlFromFields = getFirestoreIndexCreationUrl('reminders', parsedFields);
    return {
      isIndexError: true,
      indexUrl: urlFromFields,
      fields: parsedFields
    };
  }
  
  // Fallback to a generic URL for the most common index we need
  const genericUrl = getFirestoreIndexCreationUrl('reminders', ['userId', 'dueDate', 'priority']);
  return {
    isIndexError: true,
    indexUrl: genericUrl,
    fields: ['userId', 'dueDate', 'priority']
  };
};

// Parse Firestore error to extract required index fields
export const parseIndexRequiredError = (error: any): string[] | null => {
  if (!error) return null;
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || String(error);
  
  try {
    // Look for fields that need indexing
    const matchCollection = errorMessage.match(/for collection group \[([^\]]+)\]/);
    if (!matchCollection) return null;
    
    const fieldsPattern = /composite index \[(.*?)\]/;
    const fieldsMatch = errorMessage.match(fieldsPattern);
    
    if (fieldsMatch && fieldsMatch[1]) {
      // Parse the field paths from the error message
      return fieldsMatch[1].split(',').map(field => field.trim());
    }
    
    // Try to extract URL-encoded fields from the Firebase console URL
    const urlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com\/[^\s"')]+/);
    if (urlMatch) {
      const url = urlMatch[0];
      const fieldsParam = url.match(/create_composite=([^&]+)/);
      
      if (fieldsParam && fieldsParam[1]) {
        try {
          const decoded = decodeURIComponent(fieldsParam[1]);
          const fieldsObj = JSON.parse(decoded);
          
          return fieldsObj.map((field: any) => 
            typeof field === 'object' && field.fieldPath ? field.fieldPath : String(field)
          );
        } catch (e) {
          console.error("Error parsing fields from URL:", e);
        }
      }
    }
  } catch (e) {
    console.error("Error parsing index fields from error:", e);
  }
  
  // Default fields for the most common index we need
  return ['userId', 'dueDate', 'priority'];
};
