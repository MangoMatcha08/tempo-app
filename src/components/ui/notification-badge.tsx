
import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  className?: string;
  variant?: 'default' | 'sidebar';
}

const NotificationBadge = ({ className, variant = 'default' }: NotificationBadgeProps) => {
  const { unreadCount, markAllRead } = useNotifications();
  
  // Don't render anything if there are no notifications
  if (unreadCount === 0) {
    return (
      <Bell className={cn(
        "h-5 w-5 text-slate-500",
        className
      )} />
    );
  }
  
  // Format the count for display
  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();
  
  // Sidebar variant has a different style
  if (variant === 'sidebar') {
    return (
      <div className="relative">
        <Bell className={cn("h-5 w-5 text-slate-500", className)} />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
          {displayCount}
        </span>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className="relative" onClick={markAllRead}>
      <Bell className={cn("h-5 w-5 text-slate-500", className)} />
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
        {displayCount}
      </span>
    </div>
  );
};

export default NotificationBadge;
