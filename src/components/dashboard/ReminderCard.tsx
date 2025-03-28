
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
}

interface ReminderCardProps {
  reminder: Reminder;
}

const ReminderCard = ({ reminder }: ReminderCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-amber-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-blue-500";
    }
  };
  
  const formatTimeRemaining = (dueDate: Date) => {
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return "Overdue";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  return (
    <Card className={`border-l-4 ${getPriorityColor(reminder.priority)}`}>
      <CardContent className="p-4">
        <h3 className="font-medium mb-1">{reminder.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{reminder.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {formatTimeRemaining(reminder.dueDate)}
          </div>
          
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
            <span className="sr-only">Mark as done</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderCard;
