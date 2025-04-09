
import React from 'react';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationCenter from '@/components/notifications/NotificationCenter';

const Header = () => {
  return (
    <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="flex items-center space-x-2">
        <NotificationCenter className="mr-2" />
        <Button variant="outline" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">User menu</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
