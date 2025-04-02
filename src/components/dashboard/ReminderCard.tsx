
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTime } from "@/utils/typeUtils";

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

// Cache for priority classes to avoid recalculating
const priorityClassCache: Record<string, string> = {
  high: "border-l-4 border-l-red-500",
  medium: "border-l-4 border-l-amber-500",
  low: "border-l-4 border-l-blue-500"
};

// Memoize component to prevent unnecessary re-renders
const ReminderCard = memo(({ reminder, onComplete, onEdit }: ReminderCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Get cached priority class or calculate it
  const priorityClass = useMemo(() => 
    priorityClassCache[reminder.priority] || "",
    [reminder.priority]
  );
  
  // Format time using the cached formatter
  const formattedTime = useMemo(() => 
    formatTime(reminder.dueDate, 'time'),
    [reminder.dueDate]
  );

  // Memoize event handlers
  const handleComplete = useCallback(() => {
    setIsCompleting(true);
    // Let the animation play before actually completing
    setTimeout(() => {
      onComplete(reminder.id);
    }, 800);
  }, [reminder.id, onComplete]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(reminder);
  }, [reminder, onEdit]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      // Cleanup timeout if component unmounts during animation
      setIsCompleting(false);
    };
  }, []);

  return (
    <Card 
      className={`shadow-md ${priorityClass} transition-all duration-300 ${
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
              onCheckedChange={handleComplete}
            />
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium">{reminder.title}</h3>
            {reminder.description && (
              <p className="text-sm mt-1">{reminder.description}</p>
            )}
            
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>
                {reminder.location && `${reminder.location} • `}
                {formattedTime}
              </span>
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 ml-1 flex-shrink-0"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// Set display name for better debugging in React DevTools
ReminderCard.displayName = "ReminderCard";

export default ReminderCard;
