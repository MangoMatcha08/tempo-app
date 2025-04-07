
import React from "react";
import { NotificationRecord } from "@/types/notifications/notificationHistoryTypes";
import NotificationCard from "./NotificationCard";
import { Info } from "lucide-react";

interface NotificationListProps {
  notifications: NotificationRecord[];
  onAction: (id: string, action: 'view' | 'dismiss') => void;
  onMarkRead: (id: string) => void;
  emptyMessage?: string;
  className?: string;
}

const NotificationList = ({
  notifications,
  onAction,
  onMarkRead,
  emptyMessage = "No notifications",
  className
}: NotificationListProps) => {

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-3">
          <Info className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-slate-600 dark:text-slate-300">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {notifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onAction={onAction}
            onMarkRead={onMarkRead}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationList;
