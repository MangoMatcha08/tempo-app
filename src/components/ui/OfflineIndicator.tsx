
import React from 'react';
import { useOfflineSyncContext } from '@/contexts/OfflineSyncContext';
import { cn } from '@/lib/utils';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className }) => {
  const { isOffline, pendingItemCount, syncing, syncNow } = useOfflineSyncContext();
  
  if (!isOffline && pendingItemCount === 0) {
    return null;
  }
  
  return (
    <div 
      className={cn(
        'fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-3 py-2 text-sm shadow-lg',
        isOffline ? 'bg-red-500 text-white' : 'bg-amber-500 text-white',
        className
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You're offline</span>
        </>
      ) : pendingItemCount > 0 ? (
        <>
          <button 
            onClick={() => syncNow()}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            <span>Sync {pendingItemCount} item{pendingItemCount !== 1 ? 's' : ''}</span>
          </button>
        </>
      ) : null}
    </div>
  );
};

export default OfflineIndicator;
