
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, formatTime } from '@/utils/scheduleUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPeriodColor } from '@/utils/scheduleUtils';
import { MapPin } from 'lucide-react';

interface DayDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  day: Date | null;
  periods: Period[];
}

export const DayDetailView: React.FC<DayDetailViewProps> = ({
  isOpen,
  onClose,
  day,
  periods
}) => {
  if (!day) return null;

  // Sort periods by start time
  const sortedPeriods = [...periods].sort((a, b) => 
    a.startTime.getTime() - b.startTime.getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{formatDate(day)}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] overflow-y-auto mt-4">
          {sortedPeriods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events scheduled for this day
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {sortedPeriods.map((period) => {
                const colorClass = getPeriodColor(period.type).split(' ')[0];
                
                return (
                  <div 
                    key={period.id} 
                    className="flex flex-col space-y-1 border-l-4 pl-3 py-2 rounded-md bg-card"
                    style={{ borderLeftColor: getColorValue(colorClass) }}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{period.title}</h3>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(period.startTime)} - {formatTime(period.endTime)}
                      </div>
                    </div>
                    
                    {period.location && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {period.location}
                      </div>
                    )}
                    
                    {period.notes && (
                      <div className="text-sm mt-1 whitespace-pre-wrap">
                        {period.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to convert Tailwind color classes to their CSS color values
function getColorValue(colorClass: string): string {
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-rose-500': '#f43f5e',
    'bg-emerald-500': '#10b981',
    'bg-amber-500': '#f59e0b',
    'bg-slate-500': '#64748b',
  };
  
  return colorMap[colorClass] || '#64748b';
}
