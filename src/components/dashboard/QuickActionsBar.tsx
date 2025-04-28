
import { Button } from "@/components/ui/button";
import { Mic, Plus, Bell, Calendar, RefreshCw } from "lucide-react";
import { useState } from "react";

interface QuickActionsBarProps {
  onNewReminder: () => void;
  onNewVoiceNote: () => void;
  onRefresh?: () => Promise<boolean>;
  isRefreshing?: boolean;
}

const QuickActionsBar = ({ 
  onNewReminder, 
  onNewVoiceNote, 
  onRefresh, 
  isRefreshing = false 
}: QuickActionsBarProps) => {
  const [isRefreshAnimating, setIsRefreshAnimating] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing || isRefreshAnimating) return;
    
    setIsRefreshAnimating(true);
    try {
      await onRefresh();
    } finally {
      // Reset animation state after a delay to ensure animation completes
      setTimeout(() => {
        setIsRefreshAnimating(false);
      }, 750); // Animation duration
    }
  };
  
  return (
    <div className="flex justify-between items-center p-2 bg-secondary/10 rounded-lg mb-4">
      <div className="flex space-x-2">
        <Button 
          size="icon" 
          variant="default" 
          className="rounded-full"
          onClick={onNewVoiceNote}
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">New Voice Note</span>
        </Button>
        
        <Button 
          size="icon" 
          variant="secondary" 
          className="rounded-full"
          onClick={onNewReminder}
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Add New Reminder</span>
        </Button>
        
        {onRefresh && (
          <Button
            size="icon"
            variant="outline"
            className="rounded-full bg-white dark:bg-gray-800"
            onClick={handleRefresh}
            disabled={isRefreshing || isRefreshAnimating}
            title="Refresh Reminders"
          >
            <RefreshCw 
              className={`h-5 w-5 text-primary ${isRefreshing || isRefreshAnimating ? "animate-spin" : ""}`} 
            />
            <span className="sr-only">Refresh</span>
          </Button>
        )}
      </div>
      
      <div className="flex items-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-amber-500 mr-1" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
        </svg>
        <span className="font-bold">7 day streak</span>
      </div>
    </div>
  );
};

export default QuickActionsBar;
