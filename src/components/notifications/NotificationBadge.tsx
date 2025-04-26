
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useNotificationDisplay } from "@/hooks/notifications/useNotificationDisplay";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  className?: string;
  onClick?: () => void;
}

const NotificationBadge = ({ className, onClick }: NotificationBadgeProps) => {
  const { unreadCount } = useNotificationDisplay();
  
  const hasUnread = unreadCount > 0;
  const displayCount = unreadCount > 9 ? '9+' : unreadCount;
  const ariaLabel = `${unreadCount} unread notifications`;
  
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <button 
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={onClick}
        aria-label={ariaLabel}
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <div 
            role="status"
            aria-label={ariaLabel}
            className="absolute top-1 right-1 flex"
          >
            <Badge 
              className="h-4 w-4 flex items-center justify-center text-[10px] p-0 m-0"
              variant="destructive"
            >
              {displayCount}
            </Badge>
          </div>
        )}
      </button>
    </div>
  );
};

export default NotificationBadge;
