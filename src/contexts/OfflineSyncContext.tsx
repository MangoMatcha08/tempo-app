
/**
 * Offline Sync Context
 * 
 * Provides application-wide access to offline sync capabilities
 * Handles synchronization of notifications when connectivity is restored
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { offlineNotificationManager } from '@/utils/offlineNotificationManager';

interface OfflineSyncContextType {
  syncing: boolean;
  lastSyncTime: number | null;
  pendingItemCount: number;
  syncNow: () => Promise<void>;
  isOffline: boolean;
  connectionType: string | null;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  syncing: false,
  lastSyncTime: null,
  pendingItemCount: 0,
  syncNow: async () => {},
  isOffline: false,
  connectionType: null
});

export function useOfflineSyncContext() {
  return useContext(OfflineSyncContext);
}

interface OfflineSyncProviderProps {
  children: React.ReactNode;
}

export const OfflineSyncProvider: React.FC<OfflineSyncProviderProps> = ({ children }) => {
  const { syncing, lastSyncTime, syncOfflineNotifications, isOffline, connectivity } = useOfflineSync();
  const [pendingItemCount, setPendingItemCount] = useState(0);
  const { flags } = useFeatureFlags();

  // Check for pending items periodically
  useEffect(() => {
    // Only run if feature is enabled
    if (!flags.OFFLINE_NOTIFICATIONS) return;

    // Initial check
    const checkPending = () => {
      const offlineNotifications = offlineNotificationManager.getOfflineNotifications();
      setPendingItemCount(offlineNotifications.length);
    };
    
    checkPending();
    
    // Set up periodic check
    const interval = setInterval(checkPending, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [flags.OFFLINE_NOTIFICATIONS]);
  
  // Check pending count after sync
  useEffect(() => {
    if (!syncing && lastSyncTime) {
      const offlineNotifications = offlineNotificationManager.getOfflineNotifications();
      setPendingItemCount(offlineNotifications.length);
    }
  }, [syncing, lastSyncTime]);
  
  // Sync when app loads if needed
  useEffect(() => {
    // Only run if feature is enabled and we're online
    if (flags.OFFLINE_NOTIFICATIONS && !isOffline && offlineNotificationManager.isSyncNeeded()) {
      syncOfflineNotifications();
    }
  }, [flags.OFFLINE_NOTIFICATIONS, isOffline, syncOfflineNotifications]);
  
  const syncNow = async () => {
    await syncOfflineNotifications();
  };
  
  const value: OfflineSyncContextType = {
    syncing,
    lastSyncTime,
    pendingItemCount,
    syncNow,
    isOffline,
    connectionType: connectivity.type
  };
  
  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

export default OfflineSyncProvider;
