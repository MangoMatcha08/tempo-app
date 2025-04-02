
import { isMissingIndexError, getFirestoreIndexCreationUrl } from '@/lib/firebase';
import { useState, useCallback } from 'react';

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
  
  /**
   * Handle Firestore query errors, detecting index issues
   */
  const handleQueryError = useCallback((error: any, collectionId: string, fieldPaths: string[]) => {
    if (isMissingIndexError(error)) {
      console.warn(`Index needed for ${collectionId} on fields: ${fieldPaths.join(', ')}`);
      
      // Update the indexNeeded state
      setIndexNeeded(prev => ({ ...prev, [collectionId]: true }));
      
      // Generate a URL for index creation (helpful for development)
      const indexUrl = getFirestoreIndexCreationUrl(collectionId, fieldPaths);
      if (indexUrl) {
        console.info(`Create index at: ${indexUrl}`);
      }
      
      return true;
    }
    
    return false;
  }, []);
  
  /**
   * Get whether an index is needed for a collection
   */
  const isIndexNeededForCollection = useCallback((collectionId: string) => {
    return indexNeeded[collectionId] || false;
  }, [indexNeeded]);
  
  return {
    handleQueryError,
    isIndexNeededForCollection,
    indexNeeded,
    REMINDER_INDEX_FIELDS,
    PERIOD_INDEX_FIELDS
  };
}
