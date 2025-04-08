
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationDisplay } from "@/hooks/useNotificationDisplay";
import { Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const NotificationSummary = () => {
  const { notifications, unreadCount } = useNotificationDisplay({ 
    limit: 5 
  });

  const recentNotifications = notifications.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <Bell className="h-4 w-4 mr-2" />
          Recent Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5">
              {unreadCount} new
            </span>
          )}
        </CardTitle>
        <Link to="/notifications">
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recentNotifications.length > 0 ? (
          <ul className="space-y-2">
            {recentNotifications.map((notification) => (
              <li key={notification.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{notification.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <p>No recent notifications</p>
          </div>
        )}
        
        {notifications.length === 0 && (
          <div className="flex justify-center mt-3">
            <Link to="/settings">
              <Button variant="outline" size="sm">
                Configure Notifications
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSummary;
