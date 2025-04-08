
import React, { useRef, useCallback } from "react";
import { NotificationRecord } from "@/types/notifications/notificationHistoryTypes";
import NotificationCard from "./NotificationCard";
import { Info } from "lucide-react";
import { FixedSizeList as List } from 'react-window';
import { useIsMobile } from '@/hooks/use-mobile';

// Row renderer component for virtualized list
const NotificationRow = React.memo(({ 
  data, 
  index, 
  style 
}: { 
  data: { 
    notifications: NotificationRecord[], 
    onAction: (id: string, action: 'view' | 'dismiss') => void,
    onMarkRead: (id: string) => void
  }, 
  index: number, 
  style: React.CSSProperties 
}) => {
  const notification = data.notifications[index];
  return (
    <div style={{ 
      ...style, 
      paddingTop: 6,
      paddingBottom: 6
    }}>
      <NotificationCard
        notification={notification}
        onAction={data.onAction}
        onMarkRead={data.onMarkRead}
      />
    </div>
  );
});

NotificationRow.displayName = 'NotificationRow';

interface VirtualizedNotificationListProps {
  notifications: NotificationRecord[];
  onAction: (id: string, action: 'view' | 'dismiss') => void;
  onMarkRead: (id: string) => void;
  emptyMessage?: string;
  className?: string;
  height?: number;
  loading?: boolean;
}

const VirtualizedNotificationList = ({
  notifications,
  onAction,
  onMarkRead,
  emptyMessage = "No notifications",
  className,
  height = 400, // Default height if not specified
  loading = false
}: VirtualizedNotificationListProps) => {
  const listRef = useRef<List>(null);
  const isMobile = useIsMobile();

  // Calculate row height based on mobile status
  const rowHeight = isMobile ? 160 : 140;

  // Prepare list data for the virtualized list
  const listData = useCallback(() => ({
    notifications,
    onAction,
    onMarkRead
  }), [notifications, onAction, onMarkRead]);

  // Handle empty state
  if (notifications.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-3">
          <Info className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-slate-600 dark:text-slate-300">{emptyMessage}</p>
      </div>
    );
  }

  // Handle loading state
  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-600 dark:text-slate-300">Loading notifications...</p>
      </div>
    );
  }

  // Calculate actual height for the list container
  const listHeight = Math.min(
    height, 
    notifications.length * rowHeight + 15 // Add padding
  );

  return (
    <div className={className}>
      <List
        ref={listRef}
        height={listHeight}
        width="100%"
        itemCount={notifications.length}
        itemSize={rowHeight}
        itemData={listData()}
        className="notification-list"
        overscanCount={3}
      >
        {NotificationRow}
      </List>
    </div>
  );
};

export default VirtualizedNotificationList;
