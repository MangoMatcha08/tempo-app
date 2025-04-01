
import { Button } from "@/components/ui/button";

interface ReminderLoadingStateProps {
  isLoading: boolean;
  hasMoreReminders: boolean;
  totalCount: number;
  loadedCount: number;
  onLoadMore: () => void;
}

const ReminderLoadingState = ({ 
  isLoading, 
  hasMoreReminders, 
  totalCount,
  loadedCount,
  onLoadMore 
}: ReminderLoadingStateProps) => {
  if (isLoading && loadedCount === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Loading reminders...</span>
      </div>
    );
  }

  if (!hasMoreReminders) {
    return null;
  }

  return (
    <div className="text-center mt-6 mb-8">
      <Button 
        variant="outline" 
        onClick={onLoadMore} 
        disabled={isLoading}
        className="w-full max-w-xs"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading more...
          </>
        ) : (
          `Load More (${totalCount - loadedCount} remaining)`
        )}
      </Button>
    </div>
  );
};

export default ReminderLoadingState;
