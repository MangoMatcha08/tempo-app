
import React, { useState, useEffect } from "react";
import { useNotificationDisplay } from "@/hooks/useNotificationDisplay";
import { useNavigate } from "react-router-dom";
import NotificationList from "@/components/notifications/NotificationList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Clock, CheckCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReminderPriority, NotificationType } from "@/types/reminderTypes";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationAction } from "@/types/notifications/notificationHistoryTypes";
import { useNotificationHistory } from "@/contexts/notificationHistory";

const NotificationHistory = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Get pagination state directly from context
  const { 
    pagination: { currentPage, totalPages, pageSize },
    setPage,
    setPageSize
  } = useNotificationHistory();

  // Custom filter based on user selection
  const customFilter = (notification: any) => {
    if (filterType === "all") return true;
    if (filterType === "high" && notification.priority === ReminderPriority.HIGH) return true;
    if (filterType === "unread" && notification.status !== 'received' && notification.status !== 'clicked') return true;
    if (filterType === "read" && (notification.status === 'received' || notification.status === 'clicked')) return true;
    if (Object.values(NotificationType).includes(filterType as NotificationType) && notification.type === filterType) return true;
    return false;
  };

  const {
    notifications,
    loading,
    markAsRead,
    handleAction,
    markAllAsRead,
    clearHistory,
    unreadCount
  } = useNotificationDisplay({
    limit: pageSize,
    filter: customFilter
  });

  // Handle page size changes
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
  };

  // Handle notification action
  const onNotificationAction = (id: string, action: NotificationAction) => {
    handleAction(id, action);
    
    if (action === 'view') {
      // Find notification to navigate to its reminder
      const notification = notifications.find(n => n.id === id);
      if (notification?.reminderId) {
        navigate(`/dashboard/reminders/${notification.reminderId}`);
      }
    }
  };

  // Sort notifications based on user selection
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (sortBy === "newest") return b.timestamp - a.timestamp;
    if (sortBy === "oldest") return a.timestamp - b.timestamp;
    if (sortBy === "priority") {
      const priorities = {
        [ReminderPriority.HIGH]: 3,
        [ReminderPriority.MEDIUM]: 2,
        [ReminderPriority.LOW]: 1
      };
      return priorities[b.priority] - priorities[a.priority];
    }
    return 0;
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Notification History</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  All notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("unread")}>
                  Unread only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("read")}>
                  Read only
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>By priority</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterType("high")}>
                High priority
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>By type</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterType(NotificationType.UPCOMING)}>
                Upcoming reminders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType(NotificationType.OVERDUE)}>
                Overdue reminders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType(NotificationType.DAILY_SUMMARY)}>
                Daily summaries
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={pageSize.toString()} 
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Clock className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadCount > 0 && (
                <DropdownMenuItem onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={clearHistory}>
                Clear history
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mt-4 p-4">
        <ScrollArea className="h-[calc(100vh-180px)]">
          <NotificationList 
            notifications={sortedNotifications}
            onAction={onNotificationAction}
            onMarkRead={markAsRead}
            emptyMessage="No notifications found"
            loading={loading}
            virtualized={true}
            height={window.innerHeight - 220}
            showPagination={true}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          
          {!loading && sortedNotifications.length > 0 && (
            <div className="py-4 text-center text-muted-foreground">
              Showing {sortedNotifications.length} notifications
              {filterType !== "all" && " (filtered)"}
              {` - Page ${currentPage} of ${totalPages}`}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default NotificationHistory;
