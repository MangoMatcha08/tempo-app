
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import ReminderCard from "./ReminderCard";
import ReminderListItem from "./ReminderListItem";

const RemindersSection = () => {
  // Mock data - in a real app, this would come from useReminders hook
  const urgentReminders = [
    {
      id: "1",
      title: "Grade final papers",
      description: "Need to complete before end of day",
      dueDate: new Date(new Date().getTime() + 3600000), // 1 hour from now
      priority: "high" as const,
    },
    {
      id: "2",
      title: "Submit attendance",
      description: "For 3rd period class",
      dueDate: new Date(new Date().getTime() + 1800000), // 30 mins from now
      priority: "medium" as const,
    },
  ];
  
  const upcomingReminders = [
    {
      id: "3",
      title: "Parent-teacher conference",
      description: "Meeting with Smith family",
      dueDate: new Date(new Date().getTime() + 86400000), // Tomorrow
      priority: "medium" as const,
    },
    {
      id: "4",
      title: "Department meeting",
      description: "Curriculum planning",
      dueDate: new Date(new Date().getTime() + 172800000), // Day after tomorrow
      priority: "low" as const,
    },
    {
      id: "5",
      title: "Order lab supplies",
      description: "For next month's experiments",
      dueDate: new Date(new Date().getTime() + 259200000), // 3 days from now
      priority: "medium" as const,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {urgentReminders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Urgent</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {urgentReminders.map((reminder) => (
                <ReminderCard key={reminder.id} reminder={reminder} />
              ))}
            </div>
          </div>
        )}
        
        {upcomingReminders.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Upcoming</h3>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <ReminderListItem key={reminder.id} reminder={reminder} />
              ))}
            </div>
          </div>
        )}
        
        {urgentReminders.length === 0 && upcomingReminders.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No active reminders. Click "Quick Reminder" to add one.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RemindersSection;
