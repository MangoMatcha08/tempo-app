
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { formatDayShort, formatDateShort, getHoursArray, getHourPosition } from '@/utils/scheduleUtils';
import { PeriodBlock } from './PeriodBlock';
import { isToday } from 'date-fns';
import { DayColumn } from './DayColumn';
import { TimeAxis } from './TimeAxis';

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
  const hours = getHoursArray();
  
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
  
  return (
    <div className="relative overflow-x-auto pb-6 card bg-card">
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
