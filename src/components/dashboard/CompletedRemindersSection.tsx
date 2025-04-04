import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo2, ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { UIReminder } from "@/types/reminderTypes";

interface CompletedRemindersSectionProps {
  reminders: UIReminder[];
  onUndoComplete: (id: string) => void;
  onClearAllCompleted?: () => void;
  onClearCompleted?: (id: string) => void;
}

const CompletedRemindersSection = ({ 
  reminders, 
  onUndoComplete,
  onClearAllCompleted,
  onClearCompleted
}: CompletedRemindersSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // Sort by completion time (most recent first)
  const sortedReminders = [...reminders].sort((a, b) => {
    if (!a.completedAt || !b.completedAt) return 0;
    return b.completedAt.getTime() - a.completedAt.getTime();
  });

  const handleUndoComplete = (id: string) => {
    console.log("Undoing completion for reminder:", id);
    onUndoComplete(id);
    toast({
      title: "Reminder Restored",
      description: "The reminder has been moved back to your active list."
    });
  };

  const handleClearCompleted = (id: string) => {
    if (onClearCompleted) {
      console.log("Clearing completed reminder:", id);
      onClearCompleted(id);
      toast({
        title: "Reminder Removed",
        description: "The completed reminder has been removed."
      });
    }
  };

  const handleClearAllCompleted = () => {
    if (onClearAllCompleted) {
      console.log("Clearing all completed reminders");
      onClearAllCompleted();
      toast({
        title: "Completed Reminders Cleared",
        description: `${sortedReminders.length} completed ${sortedReminders.length === 1 ? 'reminder has' : 'reminders have'} been removed.`
      });
    }
  };

  return (
    <div className="space-y-2">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border rounded-md bg-card"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/10 rounded-t-md">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">Completed ({sortedReminders.length})</h2>
            </div>
            <div className="flex items-center space-x-2">
              {sortedReminders.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span className="sr-only sm:not-sr-only sm:inline-block">Clear All</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear completed reminders?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove {sortedReminders.length} completed {sortedReminders.length === 1 ? 'reminder' : 'reminders'}. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearAllCompleted}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {sortedReminders.length > 0 ? (
            <div className="divide-y divide-border">
              {sortedReminders.map((reminder) => (
                <div key={reminder.id} className="p-4 flex items-center hover:bg-accent/5">
                  <div className="mr-4">
                    <Checkbox 
                      className="h-6 w-6 rounded-sm border-2 border-gray-300"
                      checked={true}
                      disabled
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium line-through text-muted-foreground">{reminder.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Completed {reminder.completedAt ? formatDistanceToNow(reminder.completedAt, { addSuffix: true }) : ''}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-primary"
                      onClick={() => handleUndoComplete(reminder.id)}
                      title="Restore reminder"
                    >
                      <Undo2 className="h-4 w-4" />
                      <span className="sr-only">Undo completion</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-destructive"
                      onClick={() => handleClearCompleted(reminder.id)}
                      title="Remove reminder"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No completed reminders yet
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CompletedRemindersSection;
