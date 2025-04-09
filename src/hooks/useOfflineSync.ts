
/**
 * Offline Sync Hook
 * 
 * Handles synchronization of offline data when connectivity is restored
 */

import { useState, useEffect, useCallback } from 'react';
import { useConnectivity } from './useConnectivity';
import { offlineNotificationManager } from '@/utils/offlineNotificationManager';
import { useServiceWorker } from './useServiceWorker';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { useToast } from './use-toast';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';

export function useOfflineSync() {
  const connectivity = useConnectivity();
  const { sendMessage } = useServiceWorker();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const { addNotification, updateNotificationStatus } = useNotificationHistory();
  const { toast } = useToast();
  const { flags } = useFeatureFlags();
  
  // Sync notifications that were stored while offline
  const syncOfflineNotifications = useCallback(async () => {
    if (syncing || !connectivity.online) return;
    
    try {
      setSyncing(true);
      
      // Get offline notifications
      const offlineNotifications = offlineNotificationManager.getOfflineNotifications();
      
      if (offlineNotifications.length === 0) {
        offlineNotificationManager.markLastSync();
        setLastSyncTime(Date.now());
        setSyncing(false);
        return;
      }
      
      console.log(`Syncing ${offlineNotifications.length} offline notifications`);
      
      // Process each offline notification
      for (const notification of offlineNotifications) {
        // Add to notification history if not already there
        addNotification(notification);
        
        // Update status to reflect it's been processed
        updateNotificationStatus(notification.id, 'delivered');
        
        // Remove from offline storage
        offlineNotificationManager.removeOfflineNotification(notification.id);
      }
      
      if (flags.BACKGROUND_SYNC) {
        // Register background sync if supported
        await offlineNotificationManager.registerOfflineSync();
      }
      
      // Trigger service worker sync
      await sendMessage({ type: 'SYNC_REMINDERS' });
      
      // Mark sync time
      offlineNotificationManager.markLastSync();
      setLastSyncTime(Date.now());
      
      // Show success toast if configured and there were notifications
      if (flags.SHOW_SYNC_NOTIFICATIONS && offlineNotifications.length > 0) {
        toast({
          title: "Notifications synchronized",
          description: `${offlineNotifications.length} notifications processed`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error syncing offline notifications:', error);
    } finally {
      setSyncing(false);
    }
  }, [connectivity.online, syncing, addNotification, updateNotificationStatus, sendMessage, toast, flags]);
  
  // Check for and process offline notifications when coming back online
  useEffect(() => {
    if (connectivity.reconnectedAt && connectivity.online) {
      // Wait a moment for network to stabilize
      const timeout = setTimeout(() => {
        syncOfflineNotifications();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [connectivity.reconnectedAt, connectivity.online, syncOfflineNotifications]);
  
  // Provide manual sync capability
  const manualSync = useCallback(() => {
    if (connectivity.online) {
      syncOfflineNotifications();
    } else {
      toast({
        title: "Cannot sync",
        description: "You are currently offline",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [connectivity.online, syncOfflineNotifications, toast]);
  
  return {
    syncing,
    lastSyncTime,
    syncOfflineNotifications: manualSync,
    isOffline: !connectivity.online,
    connectivity
  };
}

export default useOfflineSync;
