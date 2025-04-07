import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings, Bell, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationBadge from '@/components/ui/notification-badge';
import NotificationCenter from './NotificationCenter';

interface DashboardHeaderProps {
  onOpenSidebar?: () => void;
  showSidebarToggle?: boolean;
}

const DashboardHeader = ({ 
  onOpenSidebar, 
  showSidebarToggle = false 
}: DashboardHeaderProps) => {
  const { user } = useAuth();
  const { permissionGranted, requestPermission } = useNotifications();
  
  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(name => name[0]).join('').toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'U';
  
  const handleEnableNotifications = async () => {
    if (!permissionGranted) {
      await requestPermission();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {/* Mobile sidebar toggle */}
      {showSidebarToggle && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            {/* Mobile sidebar content */}
            <div className="grid gap-2 py-6">
              <div className="flex items-center gap-2 px-2">
                <Link to="/dashboard" className="flex items-center gap-1 font-semibold">
                  <span className="text-primary">Tempo</span>
                  <span>Wizard</span>
                </Link>
              </div>
              <nav className="grid gap-1 px-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/reminders"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                >
                  Reminders
                </Link>
                <Link
                  to="/dashboard/periods"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                >
                  Periods
                </Link>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Logo - only on mobile */}
      <Link to="/dashboard" className="md:hidden flex items-center gap-1 font-semibold">
        <span className="text-primary">Tempo</span>
        <span>Wizard</span>
      </Link>
      
      {/* Search */}
      <div className="relative flex-1 md:grow-0 md:basis-1/3">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search reminders..."
          className="w-full bg-background pl-8 md:w-[200px] lg:w-[300px]"
        />
      </div>
      
      {/* Right side actions */}
      <div className="flex flex-1 items-center justify-end gap-4">
        <div 
          className="relative cursor-pointer" 
          onClick={permissionGranted ? undefined : handleEnableNotifications}
          title={permissionGranted ? "Notifications" : "Enable notifications"}
        >
          <NotificationCenter />
        </div>
        
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </Link>
        
        <Link to="/profile">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default DashboardHeader;
