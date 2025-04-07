
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { NotificationAction } from '@/types/notifications/notificationHistoryTypes';

/**
 * Interface for items in the offline queue
 */
interface OfflineQueueItem {
  id: string;
  action: NotificationAction;
  reminderId: string;
  timestamp: number;
  payload: any;
  retryCount: number;
  lastAttempt?: number;
}

/**
 * Database schema for IndexedDB
 */
interface OfflineQueueDB extends DBSchema {
  offlineQueue: {
    key: string;
    value: OfflineQueueItem;
    indexes: {
      'by-timestamp': number;
      'by-action': string;
    };
  };
}

// Database name and version
const DB_NAME = 'tempo-offline-queue';
const DB_VERSION = 1;

/**
 * Class to manage offline actions queue
 */
export class OfflineQueue {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;
  private ready: Promise<boolean>;

  constructor() {
    this.ready = this.initDatabase();
  }

  /**
   * Initialize the database
   */
  private async initDatabase(): Promise<boolean> {
    try {
      this.db = await openDB<OfflineQueueDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create the offline queue store if it doesn't exist
          if (!db.objectStoreNames.contains('offlineQueue')) {
            const store = db.createObjectStore('offlineQueue', {
              keyPath: 'id'
            });
            
            // Create indexes
            store.createIndex('by-timestamp', 'timestamp');
            store.createIndex('by-action', 'action');
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize offline queue database:', error);
      return false;
    }
  }

  /**
   * Add an item to the offline queue
   */
  async addToQueue(
    action: NotificationAction,
    reminderId: string,
    payload: any = {}
  ): Promise<string | null> {
    await this.ready;
    
    if (!this.db) {
      console.error('Database not initialized');
      return null;
    }
    
    try {
      const id = `${action}-${reminderId}-${Date.now()}`;
      
      const item: OfflineQueueItem = {
        id,
        action,
        reminderId,
        timestamp: Date.now(),
        payload,
        retryCount: 0
      };
      
      await this.db.add('offlineQueue', item);
      
      // Log for debugging
      console.log(`Added to offline queue: ${action} for reminder ${reminderId}`);
      
      return id;
    } catch (error) {
      console.error('Failed to add item to offline queue:', error);
      return null;
    }
  }

  /**
   * Get all items in the queue
   */
  async getAll(): Promise<OfflineQueueItem[]> {
    await this.ready;
    
    if (!this.db) {
      console.error('Database not initialized');
      return [];
    }
    
    try {
      return await this.db.getAll('offlineQueue');
    } catch (error) {
      console.error('Failed to get items from offline queue:', error);
      return [];
    }
  }

  /**
   * Get items by action type
   */
  async getByAction(action: NotificationAction): Promise<OfflineQueueItem[]> {
    await this.ready;
    
    if (!this.db) {
      console.error('Database not initialized');
      return [];
    }
    
    try {
      const index = this.db.transaction('offlineQueue').store.index('by-action');
      return await index.getAll(action);
    } catch (error) {
      console.error(`Failed to get ${action} items from offline queue:`, error);
      return [];
    }
  }

  /**
   * Update an item's retry count and last attempt timestamp
   */
  async updateRetryAttempt(id: string): Promise<boolean> {
    await this.ready;
    
    if (!this.db) {
      console.error('Database not initialized');
      return false;
    }
    
    try {
      const tx = this.db.transaction('offlineQueue', 'readwrite');
      const item = await tx.store.get(id);
      
      if (!item) {
        return false;
      }
      
      item.retryCount += 1;
      item.lastAttempt = Date.now();
      
      await tx.store.put(item);
      await tx.done;
      
      return true;
    } catch (error) {
      console.error('Failed to update retry attempt:', error);
      return false;
    }
  }

  /**
   * Remove an item from the queue
   */
  async removeFromQueue(id: string): Promise<boolean> {
    await this.ready;
    
    if (!this.db) {
      console.error('Database not initialized');
      return false;
    }
    
    try {
      await this.db.delete('offlineQueue', id);
      return true;
    } catch (error) {
      console.error('Failed to remove item from offline queue:', error);
      return false;
    }
  }

  /**
   * Clear all items from the queue
   */
  async clearQueue(): Promise<boolean> {
    await this.ready;
    
    if (!this.db) {
      console.error('Database not initialized');
      return false;
    }
    
    try {
      await this.db.clear('offlineQueue');
      return true;
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
      return false;
    }
  }

  /**
   * Get the number of items in the queue
   */
  async getQueueSize(): Promise<number> {
    await this.ready;
    
    if (!this.db) {
      console.error('Database not initialized');
      return 0;
    }
    
    try {
      const count = await this.db.count('offlineQueue');
      return count;
    } catch (error) {
      console.error('Failed to get queue size:', error);
      return 0;
    }
  }
}

// Create and export a singleton instance
export const offlineQueue = new OfflineQueue();

// Export default instance for convenience
export default offlineQueue;
