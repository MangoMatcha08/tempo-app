
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UIReminder } from "@/types/reminderTypes";
import { Undo2, Trash2, Loader2 } from "lucide-react";
import { memo } from "react";

interface CompletedRemindersSectionProps {
  reminders: UIReminder[];
  onUndoComplete: (id: string) => void;
  onClearAllCompleted?: () => void;
  onClearCompleted?: (id: string) => void;
  pendingReminders?: Map<string, boolean>;
}

// Use memo to prevent unnecessary re-renders
const CompletedRemindersSection = memo(({ 
  reminders, 
  onUndoComplete, 
  onClearAllCompleted, 
  onClearCompleted,
  pendingReminders = new Map()
}: CompletedRemindersSectionProps) => {
  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Completed</h3>
        {onClearAllCompleted && reminders.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearAllCompleted}
            className="text-muted-foreground h-8 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>
      
      <Card>
        <CardContent className="p-0">
          {reminders.slice(0, 5).map((reminder) => {
            const isPending = pendingReminders.has(reminder.id);
            return (
              <div 
                key={reminder.id} 
                className={`flex items-center justify-between p-3 border-b last:border-b-0 ${isPending ? 'opacity-80' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-sm line-through text-muted-foreground">
                      {reminder.title}
                    </span>
                    {isPending && (
                      <span className="text-xs text-muted-foreground ml-2">
                        <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                        syncing
                      </span>
                    )}
                  </div>
                  {reminder.completedTimeAgo && (
                    <div className="text-xs text-muted-foreground">
                      Completed {reminder.completedTimeAgo}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onUndoComplete(reminder.id)}
                    disabled={isPending}
                  >
                    <Undo2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="sr-only">Undo</span>
                  </Button>
                  
                  {onClearCompleted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onClearCompleted(reminder.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {reminders.length > 5 && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              {reminders.length - 5} more completed
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

CompletedRemindersSection.displayName = "CompletedRemindersSection";

export default CompletedRemindersSection;
