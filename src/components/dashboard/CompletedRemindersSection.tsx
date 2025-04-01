
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  completedAt?: Date;
  completed?: boolean;
}

interface CompletedRemindersSectionProps {
  reminders: Reminder[];
  onUndoComplete: (id: string) => void;
}

const CompletedRemindersSection = ({ 
  reminders, 
  onUndoComplete 
}: CompletedRemindersSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Sort by completion time (most recent first)
  const sortedReminders = [...reminders].sort((a, b) => {
    if (!a.completedAt || !b.completedAt) return 0;
    return b.completedAt.getTime() - a.completedAt.getTime();
  });

  return (
    <div className="space-y-2 mt-6">
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
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {sortedReminders.length > 0 ? (
            <div className="divide-y divide-border">
              {sortedReminders.map((reminder) => (
                <div key={reminder.id} className="p-4 flex items-center">
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
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onUndoComplete(reminder.id)}
                  >
                    <Undo2 className="h-4 w-4" />
                    <span className="sr-only">Undo completion</span>
                  </Button>
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
