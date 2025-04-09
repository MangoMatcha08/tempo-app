
import React from "react";
import { NotificationRecord } from "@/types/notifications/notificationHistoryTypes";
import NotificationCard from "./NotificationCard";
import { Info } from "lucide-react";
import VirtualizedNotificationList from "./VirtualizedNotificationList";
import NotificationPagination from "./NotificationPagination";
import { useFeature } from "@/contexts/FeatureFlagContext";

interface NotificationListProps {
  notifications: NotificationRecord[];
  onAction: (id: string, action: 'view' | 'dismiss') => void;
  onMarkRead: (id: string) => void;
  emptyMessage?: string;
  className?: string;
  virtualized?: boolean;
  height?: number;
  loading?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const NotificationList = ({
  notifications,
  onAction,
  onMarkRead,
  emptyMessage = "No notifications",
  className,
  virtualized: explicitlyVirtualized,
  height,
  loading = false,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: NotificationListProps) => {
  // Use feature flag to determine if we should use virtualization
  const virtualizedListsEnabled = useFeature("VIRTUALIZED_LISTS");
  
  // Allow prop to override feature flag (explicit false takes precedence)
  const virtualized = explicitlyVirtualized !== false && virtualizedListsEnabled;
  
  // Determine if pagination should be shown based on feature flag
  const paginationEnabled = useFeature("PAGINATED_LOADING");
  const shouldShowPagination = showPagination && paginationEnabled;

  // Use virtualized list if requested and we have enough items
  if (virtualized && notifications.length > 5) {
    return (
      <div className="flex flex-col">
        <VirtualizedNotificationList
          notifications={notifications}
          onAction={onAction}
          onMarkRead={onMarkRead}
          emptyMessage={emptyMessage}
          className={className}
          height={height}
          loading={loading}
        />
        
        {shouldShowPagination && onPageChange && (
          <NotificationPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            className="mt-4"
          />
        )}
      </div>
    );
  }

  // Otherwise use the standard, non-virtualized rendering approach
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

  return (
    <div className="flex flex-col">
      <div className={className}>
        <div className="space-y-3">
          {notifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onAction={(action) => onAction(notification.id, action as 'view' | 'dismiss')}
              onMarkRead={() => onMarkRead(notification.id)}
            />
          ))}
        </div>
      </div>
      
      {shouldShowPagination && onPageChange && (
        <NotificationPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default NotificationList;
