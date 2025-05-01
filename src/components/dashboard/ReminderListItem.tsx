
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { formatTimeWithPeriod, getPriorityBorderClass, getPriorityColorClass } from "@/utils/timeUtils";
import { normalizePriority } from "@/utils/typeUtils";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  location?: string;
  completed?: boolean;
  createdAt?: Date;
  periodId?: string;
}

interface ReminderListItemProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
  isPending?: boolean;
}

const ReminderListItem = ({ reminder, onComplete, onEdit, isPending = false }: ReminderListItemProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Normalize priority to handle legacy formats
  const normalizedPriority = normalizePriority(reminder.priority);
  
  // Get the correct border color for this priority
  const priorityBorderClass = getPriorityBorderClass(normalizedPriority);
  
  // Check if reminder was created in the last 2 hours
  const isRecentlyCreated = () => {
    if (!reminder.createdAt) return false;
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    return reminder.createdAt > twoHoursAgo;
  };
  
  const formatDueDate = (dueDate: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateText = "";
    if (
      dueDate.getDate() === tomorrow.getDate() &&
      dueDate.getMonth() === tomorrow.getMonth() &&
      dueDate.getFullYear() === tomorrow.getFullYear()
    ) {
      dateText = "Tomorrow";
    } else {
      dateText = dueDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
    
    // Extract location/period as class period
    const periodText = reminder.location ? `${reminder.location} • ` : "";
    
    // Format time with period context - pass periodId if available
    const timeText = formatTimeWithPeriod(dueDate, reminder.periodId);
    
    return `${dateText} • ${periodText}${timeText}`;
  };

  const handleComplete = () => {
    if (isPending) return;
    
    setIsCompleting(true);
    // Let the animation play before actually completing
    setTimeout(() => {
      onComplete(reminder.id);
    }, 300);
  };

  if (isCompleting) {
    return null; // Don't render anything if being completed
  }

  return (
    <div 
      className={`border-b border-l-4 ${priorityBorderClass} p-3 flex items-center transition-all duration-300 hover:bg-slate-50 cursor-pointer ${isPending ? 'opacity-80' : ''}`}
      onClick={handleComplete}
    >
      <div 
        className={`w-2 h-2 rounded-full ${isRecentlyCreated() ? 'bg-green-500' : getPriorityDotColor(normalizedPriority)} mr-3`} 
      />
      
      <div
        className="mr-3"
        onClick={(e) => {
          e.stopPropagation();
          handleComplete();
        }}
      >
        <div className="h-7 w-7 flex items-center justify-center cursor-pointer">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Checkbox 
              className="h-6 w-6 rounded-sm border-2 border-gray-300"
              checked={false}
              onCheckedChange={() => handleComplete()}
              disabled={isPending}
            />
          )}
        </div>
      </div>
      
      <div className="flex-1">
        <div className="font-medium">
          {reminder.title}
          {isPending && (
            <span className="text-xs text-muted-foreground ml-2">(syncing)</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDueDate(reminder.dueDate)}
        </div>
      </div>
      
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 w-8 p-0 flex-shrink-0 ml-2"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(reminder);
        }}
        disabled={isPending}
      >
        <Edit className="h-4 w-4 text-gray-500" />
        <span className="sr-only">Edit</span>
      </Button>
    </div>
  );
};

// Helper function to get dot color based on priority
function getPriorityDotColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-amber-500";
    case "low":
      return "bg-blue-500";
    default:
      return "bg-blue-500";
  }
}

export default ReminderListItem;
