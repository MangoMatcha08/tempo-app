
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  location?: string;
  completed?: boolean;
}

interface ReminderListItemProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
}

const ReminderListItem = ({ reminder, onComplete, onEdit }: ReminderListItemProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-blue-500";
    }
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
    
    // Time
    const timeText = dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    return `${dateText} • ${periodText}${timeText}`;
  };

  const handleComplete = () => {
    setIsCompleting(true);
    // Let the animation play before actually completing
    setTimeout(() => {
      onComplete(reminder.id);
    }, 800);
  };

  return (
    <div 
      className={`border-b border-muted p-3 flex items-center transition-all duration-300 ${
        isCompleting ? "bg-green-100 opacity-0" : ""
      } hover:bg-slate-50 cursor-pointer`}
      onClick={() => onEdit(reminder)}
    >
      <div className={`w-2 h-2 rounded-full ${getPriorityColor(reminder.priority)} mr-3`} />
      
      <div
        className="mr-3"
        onClick={(e) => {
          e.stopPropagation();
          handleComplete();
        }}
      >
        <div className="h-7 w-7 flex items-center justify-center cursor-pointer">
          <Checkbox 
            className="h-6 w-6 rounded-sm border-2 border-gray-300"
            checked={false}
            onCheckedChange={() => handleComplete()}
          />
        </div>
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{reminder.title}</div>
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
      >
        <Edit className="h-4 w-4 text-gray-500" />
        <span className="sr-only">Edit</span>
      </Button>
    </div>
  );
};

export default ReminderListItem;
