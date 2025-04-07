
import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import NotificationBadge from '@/components/ui/notification-badge';

const NotificationCenter = () => {
  const { 
    unreadCount, 
    permissionGranted,
    requestPermission,
    handleCompleteAction,
    handleSnoozeAction
  } = useNotifications();
  const [open, setOpen] = useState(false);
  
  // Sample notifications - in a real app, these would come from the context
  const sampleNotifications = [
    {
      id: '1',
      title: 'Assignment Due',
      message: 'Your Math assignment is due in 30 minutes',
      time: new Date(),
      reminderId: 'sample-1',
      isRead: false
    },
    {
      id: '2',
      title: 'Meeting Starting',
      message: 'Team meeting starts in 5 minutes in Room 302',
      time: new Date(Date.now() - 900000), // 15 minutes ago
      reminderId: 'sample-2',
      isRead: true
    }
  ];
  
  const handleRequestPermission = async () => {
    await requestPermission();
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };
  
  const handleComplete = async (reminderId: string) => {
    await handleCompleteAction(reminderId);
    // Close the popover after action
    setOpen(false);
  };
  
  const handleSnooze = async (reminderId: string) => {
    await handleSnoozeAction(reminderId, 30);
    // Close the popover after action
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => permissionGranted ? setOpen(true) : handleRequestPermission()}
        >
          <NotificationBadge />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="text-sm font-medium text-center py-2 border-b">
          Notifications
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {sampleNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {sampleNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 ${notification.isRead ? '' : 'bg-slate-50'}`}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(notification.time)}
                    </div>
                  </div>
                  <div className="text-sm mt-1">{notification.message}</div>
                  <div className="mt-2 flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs px-2 flex-1"
                      onClick={() => handleComplete(notification.reminderId)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs px-2 flex-1"
                      onClick={() => handleSnooze(notification.reminderId)}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Snooze 30m
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 border-t text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full h-8 text-xs"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
