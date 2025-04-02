
import { useState, useEffect } from "react";
import { Bell, Menu, Plus, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationEnableButton from "../settings/NotificationEnableButton";
import { useNotifications } from "@/contexts/NotificationContext";

interface DashboardHeaderProps {
  openAddReminderModal: () => void;
  openVoiceRecorderModal: () => void;
  refreshData: () => Promise<boolean>;
  isRefreshing: boolean;
}

const DashboardHeader = ({ 
  openAddReminderModal, 
  openVoiceRecorderModal,
  refreshData,
  isRefreshing
}: DashboardHeaderProps) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const { permissionGranted, isSupported } = useNotifications();
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.email?.split("@")[0] || "User");
    }
  }, [user]);

  const handleRefresh = async () => {
    if (isRefreshingData) return;
    
    setIsRefreshingData(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshingData(false);
    }
  };

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <div className="flex items-center">
        <div className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Hello, {displayName}</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Show notification button only if supported and not granted */}
        {isSupported && !permissionGranted && (
          <NotificationEnableButton size="sm" variant="outline" />
        )}
        
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleRefresh}
          disabled={isRefreshingData || isRefreshing}
        >
          <RefreshCw 
            className={`h-5 w-5 ${isRefreshingData || isRefreshing ? 'animate-spin' : ''}`} 
          />
          <span className="sr-only">Refresh</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={openVoiceRecorderModal}
          className="hidden sm:flex"
        >
          <span>Voice</span>
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={openAddReminderModal}
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Add Reminder</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
