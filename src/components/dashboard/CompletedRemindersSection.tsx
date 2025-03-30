
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  // Sort by completion time (most recent first)
  const sortedReminders = [...reminders].sort((a, b) => {
    if (!a.completedAt || !b.completedAt) return 0;
    return b.completedAt.getTime() - a.completedAt.getTime();
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Completed</h2>
      
      {sortedReminders.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {sortedReminders.map((reminder) => (
              <div key={reminder.id} className="border-b border-muted p-3 flex items-center">
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
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          No completed reminders yet
        </div>
      )}
    </div>
  );
};

export default CompletedRemindersSection;
