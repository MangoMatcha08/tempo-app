
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
}

interface ReminderListItemProps {
  reminder: Reminder;
}

const ReminderListItem = ({ reminder }: ReminderListItemProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };
  
  const formatDueDate = (dueDate: Date) => {
    return dueDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-md">
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${getPriorityColor(reminder.priority)}`} />
        <div>
          <h4 className="font-medium text-sm">{reminder.title}</h4>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 mr-1" />
            {formatDueDate(reminder.dueDate)}
          </div>
        </div>
      </div>
      
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
        <Check className="h-4 w-4" />
        <span className="sr-only">Mark as done</span>
      </Button>
    </div>
  );
};

export default ReminderListItem;
