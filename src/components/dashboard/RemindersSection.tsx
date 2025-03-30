
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import ReminderCard from "./ReminderCard";
import ReminderListItem from "./ReminderListItem";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  location?: string;
  completed?: boolean;
}

interface RemindersSectionProps {
  urgentReminders: Reminder[];
  upcomingReminders: Reminder[];
  onCompleteReminder: (id: string) => void;
}

const RemindersSection = ({ 
  urgentReminders, 
  upcomingReminders, 
  onCompleteReminder 
}: RemindersSectionProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Reminders</h2>
      
      {urgentReminders.length > 0 && (
        <div className="space-y-3">
          {urgentReminders.map((reminder) => (
            <ReminderCard 
              key={reminder.id} 
              reminder={reminder} 
              onComplete={onCompleteReminder}
            />
          ))}
        </div>
      )}
      
      {upcomingReminders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Upcoming</h3>
          <Card>
            <CardContent className="p-0">
              {upcomingReminders.map((reminder) => (
                <ReminderListItem 
                  key={reminder.id} 
                  reminder={reminder} 
                  onComplete={onCompleteReminder}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      
      {urgentReminders.length === 0 && upcomingReminders.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          No active reminders. Click "Quick Reminder" to add one.
        </div>
      )}
    </div>
  );
};

export default RemindersSection;
