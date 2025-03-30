
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle } from "lucide-react";
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
      
      {urgentReminders.length > 0 ? (
        <div className="space-y-3">
          {urgentReminders.map((reminder) => (
            <ReminderCard 
              key={reminder.id} 
              reminder={reminder} 
              onComplete={onCompleteReminder}
            />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center bg-slate-50 rounded-lg border border-slate-100">
          <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
          <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
          <p className="text-sm text-slate-500">You've completed all urgent reminders for today.</p>
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
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-3" />
          <h3 className="text-xl font-medium text-slate-900">All done!</h3>
          <p className="text-slate-500 mt-1">You've completed all your reminders.</p>
          <p className="text-sm text-slate-400 mt-2">Click "Quick Reminder" to add a new one.</p>
        </div>
      )}
    </div>
  );
};

export default RemindersSection;
