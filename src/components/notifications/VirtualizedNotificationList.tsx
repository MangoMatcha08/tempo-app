
import React, { useRef, useCallback, useState, useEffect } from "react";
import { NotificationRecord } from "@/types/notifications/notificationHistoryTypes";
import NotificationCard from "./NotificationCard";
import { Info } from "lucide-react";
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useIsMobile } from '@/hooks/use-mobile';
import { notificationPerformance } from '@/utils/performanceUtils';
import AutoSizer from 'react-virtualized-auto-sizer';

// Define a separate component for row rendering to optimize re-renders
const NotificationRow = React.memo(({ 
  data, 
  index, 
  style 
}: ListChildComponentProps) => {
  const { 
    notifications, 
    onAction, 
    onMarkRead 
  } = data;
  
  const notification = notifications[index];
  const [renderId] = useState(`notification-${notification.id}`);
  
  // Measure individual item render performance
  useEffect(() => {
    const markId = notificationPerformance.startRenderingNotifications(1);
    return () => {
      notificationPerformance.endRenderingNotifications(markId);
    };
  }, [renderId]);
  
  return (
    <div style={{ 
      ...style, 
      paddingTop: 6,
      paddingBottom: 6,
      width: '100%'
    }}>
      <NotificationCard
        notification={notification}
        onAction={onAction}
        onMarkRead={onMarkRead}
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(height);
  
  // Start measuring rendering performance
  useEffect(() => {
    const markId = notificationPerformance.startRenderingNotifications(notifications.length);
    
    // Track memory usage after rendering (if browser supports it)
    if (window.performance && 'memory' in window.performance) {
      console.log('Memory usage after notification render:', 
        // @ts-ignore - memory is not in the standard TypeScript definitions
        (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB');
    }
    
    return () => {
      notificationPerformance.endRenderingNotifications(markId);
    };
  }, [notifications.length]);
  
  // Calculate row height based on mobile status
  const rowHeight = isMobile ? 165 : 145; // Adjusted heights based on typical notification card sizes

  // Dynamically adjust container height based on content and available space
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
      // Calculate height based on parent container or viewport
      const parentHeight = containerRef.current?.parentElement?.clientHeight || window.innerHeight;
      const maxListHeight = Math.min(
        parentHeight * 0.8,  // Max 80% of parent height
        notifications.length * rowHeight + 20, // Total content height plus padding
        height // User-defined max height
      );
      
      // Minimum height to show at least 2 items
      const minHeight = Math.min(rowHeight * 2, rowHeight * notifications.length);
      const newHeight = Math.max(minHeight, maxListHeight);
      
      if (newHeight !== containerHeight) {
        setContainerHeight(newHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [height, notifications.length, rowHeight, containerHeight]);

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

  // Implement the virtualized list with auto-sizing
  return (
    <div ref={containerRef} className={className} style={{ height: containerHeight }}>
      <AutoSizer disableHeight>
        {({ width }) => (
          <List
            ref={listRef}
            height={containerHeight}
            width={width}
            itemCount={notifications.length}
            itemSize={rowHeight}
            itemData={listData()}
            className="notification-list scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
            overscanCount={3} // Render additional items above/below viewport for smooth scrolling
          >
            {NotificationRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualizedNotificationList;
