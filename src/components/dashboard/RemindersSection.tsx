
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import ReminderCard from "./ReminderCard";
import ReminderListItem from "./ReminderListItem";
import { memo, useMemo } from "react";
import { FixedSizeList as List } from 'react-window';
import { useIsMobile } from '@/hooks/use-mobile';

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  location?: string;
  completed?: boolean;
  createdAt?: Date;
}

interface RemindersSectionProps {
  urgentReminders: Reminder[];
  upcomingReminders: Reminder[];
  onCompleteReminder: (id: string) => void;
  onEditReminder: (reminder: Reminder) => void;
}

// Row renderer for the virtualized list
const UpcomingRow = memo(({ 
  data, 
  index, 
  style 
}: { 
  data: { 
    items: Reminder[], 
    onComplete: (id: string) => void,
    onEdit: (reminder: Reminder) => void
  }, 
  index: number, 
  style: React.CSSProperties 
}) => {
  const reminder = data.items[index];
  return (
    <div style={style}>
      <ReminderListItem 
        key={reminder.id} 
        reminder={reminder} 
        onComplete={data.onComplete}
        onEdit={data.onEdit}
      />
    </div>
  );
});

UpcomingRow.displayName = 'UpcomingRow';

// Use React.memo to prevent unnecessary re-renders
const RemindersSection = memo(({ 
  urgentReminders, 
  upcomingReminders, 
  onCompleteReminder,
  onEditReminder
}: RemindersSectionProps) => {
  const isMobile = useIsMobile();
  
  // Determine if there are no reminders to show
  const noReminders = urgentReminders.length === 0 && upcomingReminders.length === 0;
  
  // Memoize list data to prevent unnecessary rerenders
  const listData = useMemo(() => ({
    items: upcomingReminders,
    onComplete: onCompleteReminder,
    onEdit: onEditReminder
  }), [upcomingReminders, onCompleteReminder, onEditReminder]);
  
  // Calculate list height based on number of items, with a maximum
  const listHeight = useMemo(() => {
    const itemHeight = 64; // Height of each reminder item in pixels
    const maxItems = 5; // Maximum number of items to show before scrolling
    const count = upcomingReminders.length;
    return Math.min(count, maxItems) * itemHeight;
  }, [upcomingReminders.length]);
  
  // Adjust row height based on device
  const rowHeight = useMemo(() => isMobile ? 72 : 64, [isMobile]);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Today's Reminders</h2>
      
      {urgentReminders.length > 0 ? (
        <div className="space-y-3">
          {urgentReminders.map((reminder) => (
            <ReminderCard 
              key={reminder.id} 
              reminder={reminder} 
              onComplete={onCompleteReminder}
              onEdit={onEditReminder}
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
          <h3 className="text-lg font-semibold mb-2">Coming Up Later</h3>
          <Card>
            <CardContent className="p-0 overflow-hidden">
              {upcomingReminders.length > 10 ? (
                <List
                  height={listHeight}
                  width="100%"
                  itemCount={upcomingReminders.length}
                  itemSize={rowHeight}
                  itemData={listData}
                >
                  {UpcomingRow}
                </List>
              ) : (
                // For small lists, don't use virtualization to avoid jumping issues
                upcomingReminders.map((reminder) => (
                  <ReminderListItem 
                    key={reminder.id} 
                    reminder={reminder} 
                    onComplete={onCompleteReminder}
                    onEdit={onEditReminder}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {noReminders && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-3" />
          <h3 className="text-xl font-medium text-slate-900">All done!</h3>
          <p className="text-slate-500 mt-1">You've completed all your reminders.</p>
          <p className="text-sm text-slate-400 mt-2">Click "Quick Reminder" to add a new one.</p>
        </div>
      )}
    </div>
  );
});

// Set display name for better debugging in React DevTools
RemindersSection.displayName = "RemindersSection";

export default RemindersSection;
