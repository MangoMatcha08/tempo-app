
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { DayColumn } from './DayColumn';
import { TimeAxis } from './TimeAxis';
import { useIsMobile } from '@/hooks/use-mobile';

interface WeeklyCalendarProps {
  daysOfWeek: Date[];
  periods: Period[];
  onPeriodClick: (period: Period) => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  daysOfWeek,
  periods,
  onPeriodClick
}) => {
  const isMobile = useIsMobile();
  
  // Filter periods by day
  const getPeriodsForDay = (day: Date) => {
    const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return periods.filter(period => {
      if (!period.isRecurring) {
        // For non-recurring periods, check exact date
        const periodDate = period.startTime;
        return (
          periodDate.getFullYear() === day.getFullYear() &&
          periodDate.getMonth() === day.getMonth() &&
          periodDate.getDate() === day.getDate()
        );
      }
      
      // For recurring periods, check if this day of week is included
      return period.daysOfWeek?.includes(dayOfWeek) ?? false;
    });
  };
  
  if (isMobile) {
    // Mobile view: Show days as horizontally scrollable tabs
    return (
      <div className="relative overflow-x-auto pb-4 bg-card">
        <div className="overflow-x-auto">
          <div className="flex">
            {/* Time axis always visible */}
            <TimeAxis />
            
            {/* Only show 3 days in view with horizontal scroll */}
            <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)]">
              {daysOfWeek.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  periods={getPeriodsForDay(day)}
                  onPeriodClick={onPeriodClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop view: Show full week grid
  return (
    <div className="relative overflow-x-auto pb-4 bg-card">
      <div className="grid grid-cols-8 min-w-[800px]">
        {/* Time axis */}
        <TimeAxis />
        
        {/* Day columns */}
        {daysOfWeek.map((day) => (
          <DayColumn
            key={day.toISOString()}
            day={day}
            periods={getPeriodsForDay(day)}
            onPeriodClick={onPeriodClick}
          />
        ))}
      </div>
    </div>
  );
};
