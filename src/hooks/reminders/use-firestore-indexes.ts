
import { isMissingIndexError, getFirestoreIndexCreationUrl, parseIndexRequiredError } from '@/lib/firebase/indexing';
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Fields that need indexes for common queries
const REMINDER_INDEX_FIELDS = [
  { fieldPath: 'userId', order: 'ASCENDING' },
  { fieldPath: 'createdAt', order: 'DESCENDING' }
];

const PERIOD_INDEX_FIELDS = [
  { fieldPath: 'userId', order: 'ASCENDING' },
  { fieldPath: 'startDate', order: 'ASCENDING' }
];

/**
 * Hook to help manage Firestore indexes
 */
export function useFirestoreIndexes() {
  const [indexNeeded, setIndexNeeded] = useState<Record<string, boolean>>({});
  const [indexFields, setIndexFields] = useState<Record<string, string[]>>({});
  const { toast } = useToast();
  
  /**
   * Handle Firestore query errors, detecting index issues
   */
  const handleQueryError = useCallback((error: any, collectionId: string, fieldPaths: string[]) => {
    if (isMissingIndexError(error)) {
      console.warn(`Index needed for ${collectionId} on fields: ${fieldPaths.join(', ')}`);
      
      // Try to parse specific fields from the error
      const parsedFields = parseIndexRequiredError(error) || fieldPaths;
      
      // Update the indexNeeded state
      setIndexNeeded(prev => ({ ...prev, [collectionId]: true }));
      
      // Update the index fields
      setIndexFields(prev => ({ ...prev, [collectionId]: parsedFields }));
      
      // Generate a URL for index creation (helpful for development)
      const indexUrl = getFirestoreIndexCreationUrl(collectionId, parsedFields);
      if (indexUrl) {
        console.info(`Create index at: ${indexUrl}`);
        
        // Show toast with link to create index
        toast({
          title: 'Firestore Index Required',
          description: `For optimal performance, create the missing index for collection: ${collectionId}`,
          duration: 10000,
        });
      }
      
      return true;
    }
    
    return false;
  }, [toast]);
  
  /**
   * Get whether an index is needed for a collection
   */
  const isIndexNeededForCollection = useCallback((collectionId: string) => {
    return indexNeeded[collectionId] || false;
  }, [indexNeeded]);
  
  /**
   * Get the fields needed for an index on a collection
   */
  const getIndexFieldsForCollection = useCallback((collectionId: string) => {
    return indexFields[collectionId] || [];
  }, [indexFields]);
  
  return {
    handleQueryError,
    isIndexNeededForCollection,
    getIndexFieldsForCollection,
    indexNeeded,
    REMINDER_INDEX_FIELDS,
    PERIOD_INDEX_FIELDS
  };
}

