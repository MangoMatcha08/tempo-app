
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFirestoreIndexCreationUrl } from '@/lib/firebase/indexing';

interface IndexConfig {
  collection: string;
  fields: string[];
}

// Default indexes needed for the app
const DEFAULT_INDEXES: IndexConfig[] = [
  {
    collection: 'reminders',
    fields: ['userId', 'createdAt']
  },
  {
    collection: 'reminders',
    fields: ['userId', 'completed', 'dueDate']
  }
];

export function useFirestoreIndexes() {
  const [indexNeeded, setIndexNeeded] = useState<Record<string, string[]>>({});
  const { toast } = useToast();
  
  // Define constants for commonly used index configurations
  const REMINDER_INDEX_FIELDS = [
    { 
      name: 'default-sort',
      fields: ['userId', 'createdAt'] 
    },
    { 
      name: 'due-date-sort',
      fields: ['userId', 'dueDate']
    }
  ];
  
  const PERIOD_INDEX_FIELDS = [
    { 
      name: 'user-start-time',
      fields: ['userId', 'startTime']
    }
  ];
  
  // Handle a query error and check if it's an index-related error
  const handleQueryError = useCallback((error: any, collectionId: string, fieldPaths: string[]): boolean => {
    const errorMessage = String(error);
    
    // Check if this is an index error
    if (
      errorMessage.includes('index') && 
      (errorMessage.includes('required') || errorMessage.includes('needs'))
    ) {
      // Store that we need this index
      setIndexNeeded(prev => ({
        ...prev, 
        [collectionId]: fieldPaths
      }));
      
      // Try to extract the index URL from the error message if available
      let indexUrl = '';
      try {
        if (errorMessage.includes('https://console.firebase.google.com')) {
          indexUrl = errorMessage.substring(
            errorMessage.indexOf('https://console.firebase.google.com'),
            errorMessage.length
          );
          // Clean up any trailing characters
          if (indexUrl.includes('\n')) {
            indexUrl = indexUrl.substring(0, indexUrl.indexOf('\n'));
          }
        } else {
          // Generate a URL
          indexUrl = getFirestoreIndexCreationUrl(collectionId, fieldPaths) || '';
        }
      } catch (urlError) {
        console.error('Error extracting/generating index URL:', urlError);
      }
      
      // Show toast with the URL
      toast({
        title: "Firestore Index Required",
        description: `Create the necessary index for the ${collectionId} collection. ${indexUrl ? 'URL: ' + indexUrl : ''}`,
        duration: 8000,
      });
      
      return true;
    }
    
    return false;
  }, [toast]);
  
  // Check if an index is needed for a specific collection
  const isIndexNeededForCollection = useCallback((collectionId: string): boolean => {
    return !!indexNeeded[collectionId];
  }, [indexNeeded]);
  
  // Get the fields for a needed index
  const getIndexFieldsForCollection = useCallback((collectionId: string): string[] => {
    return indexNeeded[collectionId] || [];
  }, [indexNeeded]);
  
  return {
    handleQueryError,
    isIndexNeededForCollection,
    getIndexFieldsForCollection,
    indexNeeded,
    REMINDER_INDEX_FIELDS,
    PERIOD_INDEX_FIELDS
  };
}
