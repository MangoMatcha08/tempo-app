
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  completed?: boolean;
}

interface ReminderListItemProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
}

const ReminderListItem = ({ reminder, onComplete }: ReminderListItemProps) => {
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
    
    if (
      dueDate.getDate() === tomorrow.getDate() &&
      dueDate.getMonth() === tomorrow.getMonth() &&
      dueDate.getFullYear() === tomorrow.getFullYear()
    ) {
      return `Tomorrow • ${dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    return dueDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="border-b border-muted p-3 flex items-center">
      <div className={`w-2 h-2 rounded-full ${getPriorityColor(reminder.priority)} mr-3`} />
      
      <div className="flex-1">
        <div className="font-medium">{reminder.title}</div>
        <div className="text-xs text-muted-foreground">
          {formatDueDate(reminder.dueDate)}
        </div>
      </div>
      
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 w-8 p-0"
        onClick={() => onComplete(reminder.id)}
      >
        <Check className="h-5 w-5 text-green-500" />
        <span className="sr-only">Mark as done</span>
      </Button>
    </div>
  );
};

export default ReminderListItem;
