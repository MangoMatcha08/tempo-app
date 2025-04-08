
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import ReminderCard from "./ReminderCard";
import ReminderListItem from "./ReminderListItem";
import { memo, useMemo, useState, useEffect, useRef } from "react";
import { FixedSizeList as List } from 'react-window';
import { useIsMobile } from '@/hooks/use-mobile';
import { UIReminder } from "@/types/reminderTypes";
import { performanceMonitor } from '@/utils/performanceUtils';
import AutoSizer from 'react-virtualized-auto-sizer';

interface RemindersSectionProps {
  urgentReminders: UIReminder[];
  upcomingReminders: UIReminder[];
  onCompleteReminder: (id: string) => void;
  onEditReminder: (reminder: UIReminder) => void;
}

// Row renderer for the virtualized list
const UpcomingRow = memo(({ 
  data, 
  index, 
  style 
}: { 
  data: { 
    items: UIReminder[], 
    onComplete: (id: string) => void,
    onEdit: (reminder: UIReminder) => void
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
  const [stableUrgent, setStableUrgent] = useState(urgentReminders);
  const [stableUpcoming, setStableUpcoming] = useState(upcomingReminders);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Performance monitoring
  useEffect(() => {
    const markId = performanceMonitor.startMark('render-reminders-section', 'notification-render', {
      urgentCount: urgentReminders.length,
      upcomingCount: upcomingReminders.length
    });
    
    // Track memory usage if available
    if (window.performance && 'memory' in window.performance) {
      console.log('Memory usage during RemindersSection render:', 
        // @ts-ignore - memory is not in the standard TypeScript definitions
        (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB');
    }
    
    return () => {
      performanceMonitor.endMark(markId);
    };
  }, [urgentReminders.length, upcomingReminders.length]);
  
  // Use effect to stabilize the lists and prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setStableUrgent(urgentReminders);
      setStableUpcoming(upcomingReminders);
    }, 300); // Short delay to avoid flickering
    
    return () => clearTimeout(timer);
  }, [urgentReminders, upcomingReminders]);
  
  // Determine if there are no reminders to show
  const noReminders = stableUrgent.length === 0 && stableUpcoming.length === 0;
  
  // Determine if we should use virtualization based on item count
  const shouldVirtualize = useMemo(() => stableUpcoming.length > 50, [stableUpcoming.length]);
  
  // Memoize list data to prevent unnecessary rerenders
  const listData = useMemo(() => ({
    items: stableUpcoming,
    onComplete: onCompleteReminder,
    onEdit: onEditReminder
  }), [stableUpcoming, onCompleteReminder, onEditReminder]);
  
  // Calculate list height based on number of items, with a maximum
  const listHeight = useMemo(() => {
    const itemHeight = isMobile ? 72 : 64; // Height of each reminder item in pixels
    const maxItems = 5; // Maximum number of items to show before scrolling
    const count = stableUpcoming.length;
    return Math.min(count, maxItems) * itemHeight;
  }, [stableUpcoming.length, isMobile]);
  
  // Adjust row height based on device
  const rowHeight = useMemo(() => isMobile ? 72 : 64, [isMobile]);
  
  // Measure scroll performance
  const handleScroll = useMemo(() => {
    let lastScrollTime = 0;
    let scrollMarkId = '';
    
    return () => {
      const now = Date.now();
      
      // Only measure performance if we haven't measured in the last 300ms
      if (now - lastScrollTime > 300) {
        if (scrollMarkId) performanceMonitor.endMark(scrollMarkId);
        
        scrollMarkId = performanceMonitor.startMark('reminder-list-scroll', 'notification-interaction', {
          itemCount: stableUpcoming.length,
          virtual: shouldVirtualize
        });
        
        lastScrollTime = now;
      }
    };
  }, [stableUpcoming.length, shouldVirtualize]);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Today's Reminders</h2>
      
      {stableUrgent.length > 0 ? (
        <div className="space-y-3">
          {stableUrgent.map((reminder) => (
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
      
      {stableUpcoming.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Coming Up Later</h3>
          <Card>
            <CardContent className="p-0 overflow-hidden">
              {shouldVirtualize ? (
                <div ref={containerRef} style={{ height: listHeight }}>
                  <AutoSizer disableHeight>
                    {({ width }) => (
                      <List
                        ref={listRef}
                        height={listHeight}
                        width={width}
                        itemCount={stableUpcoming.length}
                        itemSize={rowHeight}
                        itemData={listData}
                        onScroll={handleScroll}
                        className="scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
                        overscanCount={3}
                      >
                        {UpcomingRow}
                      </List>
                    )}
                  </AutoSizer>
                </div>
              ) : (
                // For small lists, don't use virtualization to avoid jumping issues
                stableUpcoming.map((reminder) => (
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
