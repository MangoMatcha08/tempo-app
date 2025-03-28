
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

  // Determine min and max times for the schedule to reduce empty space
  const getScheduleBounds = () => {
    if (periods.length === 0) {
      return { minHour: 8, maxHour: 17 }; // Default 8am-5pm if no periods
    }

    let minTime = 24; // Start with end of day
    let maxTime = 0;  // Start with beginning of day

    periods.forEach(period => {
      const startHour = period.startTime.getHours();
      const endHour = period.endTime.getHours() + (period.endTime.getMinutes() > 0 ? 1 : 0);
      
      minTime = Math.min(minTime, startHour);
      maxTime = Math.max(maxTime, endHour);
    });

    // Ensure we have at least some padding
    return { 
      minHour: Math.max(7, minTime - 1), 
      maxHour: Math.min(19, maxTime + 1) 
    };
  };

  const { minHour, maxHour } = getScheduleBounds();
  
  if (isMobile) {
    // Mobile view: Show days as horizontally scrollable tabs
    return (
      <div className="relative overflow-x-auto bg-card rounded-b-md" style={{ height: `${(maxHour - minHour) * 60}px` }}>
        <div className="overflow-x-auto">
          <div className="flex">
            {/* Time axis always visible */}
            <TimeAxis minHour={minHour} maxHour={maxHour} />
            
            {/* Only show days in view with horizontal scroll */}
            <div className="grid grid-flow-col auto-cols-[minmax(130px,1fr)]">
              {daysOfWeek.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  periods={getPeriodsForDay(day)}
                  onPeriodClick={onPeriodClick}
                  minHour={minHour}
                  maxHour={maxHour}
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
    <div className="relative overflow-x-auto bg-card rounded-b-md" style={{ height: `${(maxHour - minHour) * 60}px` }}>
      <div className="grid grid-cols-8 min-w-[800px]">
        {/* Time axis */}
        <TimeAxis minHour={minHour} maxHour={maxHour} />
        
        {/* Day columns */}
        {daysOfWeek.map((day) => (
          <DayColumn
            key={day.toISOString()}
            day={day}
            periods={getPeriodsForDay(day)}
            onPeriodClick={onPeriodClick}
            minHour={minHour}
            maxHour={maxHour}
          />
        ))}
      </div>
    </div>
  );
};
