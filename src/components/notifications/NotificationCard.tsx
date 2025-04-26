import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationRecord } from "@/types/notifications/notificationHistoryTypes";
import { Bell, X, Eye } from "lucide-react";

interface NotificationCardProps {
  notification: NotificationRecord;
  onAction: (action: "view" | "dismiss") => void;
  onMarkRead: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ 
  notification, 
  onAction,
  onMarkRead 
}) => {
  const isRead = notification.status === "received" || notification.status === "clicked";
  
  const handleCardClick = () => {
    if (!isRead) {
      onMarkRead();
    }
  };

  return (
    <Card 
      className={`
        relative overflow-hidden transition-shadow hover:shadow-md
        ${isRead ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'}
        ${!isRead && 'border-l-4 border-l-blue-500'}
      `}
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-slate-100 dark:bg-slate-700 p-1">
            <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </div>
          <h3 className="font-medium">{notification.title}</h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatTime(notification.timestamp)}
        </span>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          {notification.body}
        </p>
        
        <div className="flex justify-end gap-2 mt-4">
          {notification.reminderId && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onAction("view");
              }}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onAction("dismiss");
            }}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Dismiss</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
