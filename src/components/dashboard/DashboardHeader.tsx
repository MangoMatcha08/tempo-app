
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Settings } from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import EnhancedToasts from "@/components/notifications/EnhancedToasts";

interface DashboardHeaderProps {
  onAddReminder: () => void;
  pageTitle: string;
  stats?: any;
}

const DashboardHeader = ({ onAddReminder, pageTitle, stats }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="container flex h-16 items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter className="mr-2" />
          <Button variant="outline" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
          <Button onClick={onAddReminder}>
            <Plus className="mr-2 h-4 w-4" />
            Quick Reminder
          </Button>
        </div>
      </div>
      <EnhancedToasts />
    </header>
  );
};

export default DashboardHeader;
