
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import ReminderCard from "./ReminderCard";
import ReminderListItem from "./ReminderListItem";
import { memo, useMemo, useState, useEffect, useRef } from "react";
import { FixedSizeList as List } from 'react-window';
import { useIsMobile } from '@/hooks/use-mobile';
import { UIReminder } from "@/types/reminderTypes";
import { performanceMonitor } from '@/utils/performanceUtils';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useFeature } from '@/contexts/FeatureFlagContext';
import { useListPerformance } from '@/hooks/useListPerformance';
import NotificationPagination from '../notifications/NotificationPagination';

interface RemindersSectionProps {
  urgentReminders: UIReminder[];
  upcomingReminders: UIReminder[];
  onCompleteReminder: (id: string) => void;
  onEditReminder: (reminder: UIReminder) => void;
  paginationEnabled?: boolean;
  currentPage?: number; 
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
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
  onEditReminder,
  paginationEnabled = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onLoadMore,
  isLoading = false
}: RemindersSectionProps) => {
  const isMobile = useIsMobile();
  const [stableUrgent, setStableUrgent] = useState(urgentReminders);
  const [stableUpcoming, setStableUpcoming] = useState(upcomingReminders);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Determine if we should use virtualization based on item count
  const shouldVirtualize = useMemo(() => stableUpcoming.length > 50, [stableUpcoming.length]);
  
  // Check feature flags for pagination and infinite scroll
  const paginationFeatureEnabled = useFeature('PAGINATED_LOADING');
  const infiniteScrollEnabled = useFeature('INFINITE_SCROLL') || false; // Provide default
  const shouldShowPagination = paginationEnabled && paginationFeatureEnabled && totalPages > 1;
  const shouldShowLoadMore = onLoadMore && infiniteScrollEnabled && !shouldShowPagination;
  
  // Track list performance
  const { trackScrollPerformance, getPerformanceMetrics, logMemoryUsage } = useListPerformance({
    componentName: 'RemindersSection',
    itemCount: stableUpcoming.length,
    isVirtualized: shouldVirtualize,
    enableMemoryLogging: true
  });
  
  // Performance monitoring
  useEffect(() => {
    const markId = performanceMonitor.startMark('render-reminders-section', 'notification-render', {
      urgentCount: urgentReminders.length,
      upcomingCount: upcomingReminders.length
    });
    
    // Log memory usage for performance tracking
    logMemoryUsage('initial-render');
    
    return () => {
      performanceMonitor.endMark(markId);
    };
  }, [urgentReminders.length, upcomingReminders.length, logMemoryUsage]);
  
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
  
  // Log performance metrics when component re-renders
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const metrics = getPerformanceMetrics();
      console.log('Reminder section performance:', metrics);
    }
  }, [getPerformanceMetrics]);
  
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
                        onScroll={trackScrollPerformance}
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
              
              {/* Show loading indicator if loading more */}
              {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Pagination controls */}
          {shouldShowPagination && onPageChange && (
            <div className="mt-4">
              <NotificationPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                isLoading={isLoading}
              />
            </div>
          )}
          
          {/* Load more button */}
          {shouldShowLoadMore && (
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Loading more...
                  </span>
                ) : (
                  "Load More Reminders"
                )}
              </Button>
            </div>
          )}
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
