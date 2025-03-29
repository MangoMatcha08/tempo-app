
import React, { useEffect, useRef, useState } from 'react';
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
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const viewportHeight = window.innerHeight;
        // Calculate available height (85% of viewport on mobile, 80% on desktop)
        const availableHeight = isMobile ? viewportHeight * 0.85 : viewportHeight * 0.80;
        setContainerHeight(Math.max(availableHeight, 500));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isMobile]);
  
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
  // Calculate heightPerHour based on available space and number of hours to display
  const heightPerHour = Math.max(70, (containerHeight - 80) / (maxHour - minHour)); 
  
  if (isMobile) {
    // Mobile view: Show days as horizontally scrollable tabs
    return (
      <div 
        ref={containerRef}
        className="relative overflow-hidden bg-card rounded-b-md border-t flex flex-col" 
        style={{ height: `${containerHeight}px` }}
      >
        <div className="flex-1 overflow-auto">
          <div className="flex h-full">
            {/* Time axis always visible */}
            <TimeAxis minHour={minHour} maxHour={maxHour} heightPerHour={heightPerHour} />
            
            {/* Only show days in view with horizontal scroll */}
            <div className="grid grid-flow-col auto-cols-[minmax(120px,1fr)] overflow-x-auto h-full">
              {daysOfWeek.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  periods={getPeriodsForDay(day)}
                  onPeriodClick={onPeriodClick}
                  minHour={minHour}
                  maxHour={maxHour}
                  heightPerHour={heightPerHour}
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
    <div 
      ref={containerRef}
      className="relative overflow-hidden bg-card rounded-b-md flex flex-col" 
      style={{ height: `${containerHeight}px` }}
    >
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 min-w-[800px] h-full">
          {/* Time axis */}
          <TimeAxis minHour={minHour} maxHour={maxHour} heightPerHour={heightPerHour} />
          
          {/* Day columns */}
          {daysOfWeek.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              periods={getPeriodsForDay(day)}
              onPeriodClick={onPeriodClick}
              minHour={minHour}
              maxHour={maxHour}
              heightPerHour={heightPerHour}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
