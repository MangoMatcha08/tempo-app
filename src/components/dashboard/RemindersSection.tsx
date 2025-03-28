
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import ReminderCard from "./ReminderCard";
import ReminderListItem from "./ReminderListItem";

const RemindersSection = () => {
  // Mock data - in a real app, this would come from useReminders hook
  const urgentReminders = [
    {
      id: "1",
      title: "Submit Grades",
      description: "End of quarter grades due today",
      dueDate: new Date(new Date().getTime() + 3600000), // 1 hour from now
      priority: "high" as const,
      location: "Math 101",
    },
    {
      id: "2",
      title: "Parent Conference",
      description: "Meeting with Johnson family",
      dueDate: new Date(new Date().getTime() + 1800000), // 30 mins from now
      priority: "medium" as const,
      location: "Conference Room",
    },
  ];
  
  const upcomingReminders = [
    {
      id: "3",
      title: "Order Lab Supplies",
      description: "For next month's experiments",
      dueDate: new Date(new Date().getTime() + 86400000), // Tomorrow
      priority: "low" as const,
    },
    {
      id: "4",
      title: "Staff Meeting",
      description: "Curriculum planning",
      dueDate: new Date(new Date().getTime() + 172800000), // Day after tomorrow
      priority: "medium" as const,
    },
    {
      id: "5",
      title: "Grade Essays",
      description: "English class essays",
      dueDate: new Date(new Date().getTime() + 259200000), // 3 days from now
      priority: "medium" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Reminders</h2>
      
      {urgentReminders.length > 0 && (
        <div className="space-y-3">
          {urgentReminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
      
      {upcomingReminders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Upcoming</h3>
          <Card>
            <CardContent className="p-0">
              {upcomingReminders.map((reminder) => (
                <ReminderListItem key={reminder.id} reminder={reminder} />
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
