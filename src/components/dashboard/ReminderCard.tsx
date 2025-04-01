
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
}

const ReminderCard = ({ reminder, onComplete, onEdit }: ReminderCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-amber-500";
      case "low":
        return "border-l-4 border-l-blue-500";
      default:
        return "";
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

  const formattedTime = (dueDate: Date) => {
    return dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleComplete = () => {
    setIsCompleting(true);
    // Let the animation play before actually completing
    setTimeout(() => {
      onComplete(reminder.id);
    }, 800);
  };

  useEffect(() => {
    return () => {
      // Cleanup timeout if component unmounts during animation
      setIsCompleting(false);
    };
  }, []);

  return (
    <Card 
      className={`shadow-md ${getPriorityClass(reminder.priority)} transition-all duration-300 ${
        isCompleting ? "bg-green-100 opacity-0 transform translate-y-2" : ""
      } hover:bg-slate-50`}
      onClick={handleComplete}
    >
      <CardContent className="p-4">
        <div className="flex items-start">
          <div 
            className="mr-3 mt-1 cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              handleComplete();
            }}
          >
            <Checkbox 
              className="h-6 w-6 rounded-sm border-2 border-gray-300"
              checked={false}
              onCheckedChange={() => handleComplete()}
            />
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium">{reminder.title}</h3>
            <p className="text-sm mt-1">{reminder.description}</p>
            
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>
                {reminder.location && `${reminder.location} • `}
                {formattedTime(reminder.dueDate)}
              </span>
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 ml-1 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(reminder);
            }}
          >
            <Edit className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderCard;
