
import React from "react";
import { NotificationRecord } from "@/types/notifications/notificationHistoryTypes";
import NotificationCard from "./NotificationCard";

interface VirtualizedNotificationListProps {
  notifications: NotificationRecord[];
  onAction: (id: string, action: 'view' | 'dismiss') => void;
  onMarkRead: (id: string) => void;
  emptyMessage?: string;
  className?: string;
  height?: number;
  loading?: boolean;
}

/**
 * A simplified virtualized notification list
 * In a real implementation, this would use a virtualized list library like react-window
 */
const VirtualizedNotificationList: React.FC<VirtualizedNotificationListProps> = ({
  notifications,
  onAction,
  onMarkRead,
  emptyMessage = "No notifications",
  className,
  height = 400,
  loading = false
}) => {
  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div 
      className={`space-y-3 overflow-y-auto ${className || ''}`} 
      style={{ height, maxHeight: height }}
    >
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onAction={(action) => onAction(notification.id, action)}
          onMarkRead={() => onMarkRead(notification.id)}
        />
      ))}
    </div>
  );
};

export default VirtualizedNotificationList;
