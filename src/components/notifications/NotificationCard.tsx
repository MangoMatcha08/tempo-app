
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationRecord } from "@/types/notifications/notificationHistoryTypes";
import { formatDistanceToNow } from "date-fns";
import { Bell, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationType, ReminderPriority } from "@/types/reminderTypes";
import { Button } from "@/components/ui/button";

interface NotificationCardProps {
  notification: NotificationRecord;
  onAction: (id: string, action: 'view' | 'dismiss') => void;
  onMarkRead: (id: string) => void;
  className?: string;
}

const NotificationCard = ({
  notification,
  onAction,
  onMarkRead,
  className,
}: NotificationCardProps) => {
  const { id, title, body, timestamp, type, status, priority } = notification;
  
  // Determine if notification is unread
  const isUnread = status !== 'received' && status !== 'clicked';
  
  // Format the timestamp
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case NotificationType.UPCOMING:
        return <Bell className="h-5 w-5 text-blue-500" />;
      case NotificationType.OVERDUE:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case NotificationType.DAILY_SUMMARY:
        return <Info className="h-5 w-5 text-purple-500" />;
      case NotificationType.TEST:
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };
  
  // Get background color based on priority and read status
  const getBackgroundClass = () => {
    if (isUnread) {
      return "bg-slate-50 dark:bg-slate-800";
    }
    return "bg-white dark:bg-slate-950";
  };
  
  // Get border color based on priority
  const getBorderClass = () => {
    switch (priority) {
      case ReminderPriority.HIGH:
        return "border-l-4 border-l-red-500";
      case ReminderPriority.MEDIUM:
        return "border-l-4 border-l-yellow-500";
      case ReminderPriority.LOW:
      default:
        return "border-l-4 border-l-green-500";
    }
  };
  
  // Handle card click
  const handleCardClick = () => {
    if (isUnread) {
      onMarkRead(id);
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-colors", 
        getBackgroundClass(),
        getBorderClass(),
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={cn(
                "font-medium text-sm",
                isUnread ? "font-semibold" : ""
              )}>
                {title}
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2">
                {timeAgo}
              </span>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{body}</p>
            
            <div className="flex justify-end mt-3 gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(id, 'dismiss');
                }}
              >
                Dismiss
              </Button>
              
              {notification.reminderId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(id, 'view');
                  }}
                >
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
