
import React, { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNotificationDisplay } from "@/hooks/notifications/useNotificationDisplay";
import { Bell, Check, Clock, Filter, Settings } from "lucide-react";
import NotificationBadge from "./NotificationBadge";
import NotificationList from "./NotificationList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationFeatures } from "@/hooks/notifications/useNotificationFeatures";

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
    unreadCount,
    clearHistory,
    pagination, 
    setPage,
    virtualizedListsEnabled
  } = useNotificationDisplay();

  const { isFeatureEnabled } = useNotificationFeatures();
  const historyEnabled = isFeatureEnabled("HISTORY_ENABLED");
  const paginatedLoading = isFeatureEnabled("PAGINATED_LOADING");

  const unreadNotifications = notifications.filter(
    n => n.status !== 'received' && n.status !== 'clicked'
  );
  
  const allNotifications = notifications;
  
  const handleNotificationAction = (id: string, action: 'view' | 'dismiss') => {
    handleAction(id, action);
    
    if (action === 'view') {
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {unreadCount > 0 && (
                    <DropdownMenuItem onClick={markAllAsRead}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark all as read
                    </DropdownMenuItem>
                  )}
                  {historyEnabled && (
                    <DropdownMenuItem onClick={clearHistory}>
                      <Clock className="h-4 w-4 mr-2" />
                      Clear history
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" onClick={() => setOpen(false)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Notification settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                virtualized={virtualizedListsEnabled}
                showPagination={paginatedLoading && pagination.totalPages > 1}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
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
                virtualized={virtualizedListsEnabled}
                showPagination={paginatedLoading && pagination.totalPages > 1}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button variant="secondary" className="w-full">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
