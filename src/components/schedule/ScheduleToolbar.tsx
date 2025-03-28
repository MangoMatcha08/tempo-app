import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { addDays, subDays, format } from 'date-fns';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScheduleToolbarProps {
  viewMode: 'week' | 'day';
  onViewModeChange: (mode: 'week' | 'day') => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddPeriod: () => void;
}

export const ScheduleToolbar: React.FC<ScheduleToolbarProps> = ({
  viewMode,
  onViewModeChange,
  selectedDate,
  onDateChange,
  onAddPeriod
}) => {
  const isMobile = useIsMobile();
  
  const handlePreviousWeek = () => {
    onDateChange(subDays(selectedDate, 7));
  };
  
  const handleNextWeek = () => {
    onDateChange(addDays(selectedDate, 7));
  };
  
  const handleToday = () => {
    onDateChange(new Date());
  };
  
  return (
    <Card>
      <CardContent className={`${isMobile ? 'p-2' : 'p-4'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handlePreviousWeek}>
              Previous
            </Button>
            <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleNextWeek}>
              Next
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
              {format(selectedDate, 'MMMM yyyy')}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewModeChange('day')}>
                  Day view
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewModeChange('week')}>
                  Week view
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
