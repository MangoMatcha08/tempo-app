
import React, { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNotificationDisplay } from "@/hooks/useNotificationDisplay";
import { Bell, Check } from "lucide-react";
import NotificationBadge from "./NotificationBadge";
import NotificationList from "./NotificationList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter = ({ className }: NotificationCenterProps) => {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    markAsRead, 
    handleAction,
    markAllAsRead, 
    unreadCount
  } = useNotificationDisplay();

  const unreadNotifications = notifications.filter(
    n => n.status !== 'received' && n.status !== 'clicked'
  );
  
  const allNotifications = notifications;
  
  // Handle notification actions
  const handleNotificationAction = (id: string, action: 'view' | 'dismiss') => {
    handleAction(id, action);
    
    if (action === 'view') {
      // Close the notification center when viewing a specific notification
      setOpen(false);
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className={className}>
          <NotificationBadge />
        </div>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="px-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full px-2 py-0.5 ml-2">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={markAllAsRead}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <Separator className="my-4" />
        
        <Tabs defaultValue="unread">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <span className="absolute top-1 right-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-[calc(100vh-180px)] pr-4">
              <NotificationList 
                notifications={unreadNotifications} 
                onAction={handleNotificationAction}
                onMarkRead={markAsRead}
                emptyMessage="No unread notifications"
              />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[calc(100vh-180px)] pr-4">
              <NotificationList 
                notifications={allNotifications} 
                onAction={handleNotificationAction}
                onMarkRead={markAsRead}
                emptyMessage="No notifications"
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
