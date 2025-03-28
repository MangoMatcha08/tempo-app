
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { formatDayShort, formatDateShort, getHoursArray, getHourPosition } from '@/utils/scheduleUtils';
import { PeriodBlock } from './PeriodBlock';
import { isToday } from 'date-fns';

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
  
  return (
    <div className="relative overflow-x-auto pb-6">
      <div className="grid grid-cols-8 min-w-[800px]">
        {/* Time header (empty cell) */}
        <div className="border-b border-r p-3 sticky top-0 bg-card z-10">
          <div className="w-16"></div>
        </div>
        
        {/* Day headers */}
        {daysOfWeek.map((day) => (
          <div 
            key={day.toISOString()} 
            className={`border-b p-3 text-center sticky top-0 bg-card z-10 ${
              isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="font-medium">{formatDayShort(day)}</div>
            <div className="text-sm text-muted-foreground">{formatDateShort(day)}</div>
          </div>
        ))}
        
        {/* Time axis */}
        <div className="relative border-r">
          {hours.map((hour) => (
            <div 
              key={hour} 
              className="border-b border-dashed h-20 relative"
            >
              <span className="absolute -top-2.5 -left-1 text-xs text-muted-foreground bg-card px-1">
                {hour}
              </span>
            </div>
          ))}
        </div>
        
        {/* Day columns with periods */}
        {daysOfWeek.map((day) => {
          const dayPeriods = periods.filter(period => {
            if (!period.isRecurring) {
              // For non-recurring periods, check if date matches
              const periodDate = period.startTime;
              return (
                periodDate.getFullYear() === day.getFullYear() &&
                periodDate.getMonth() === day.getMonth() &&
                periodDate.getDate() === day.getDate()
              );
            }
            
            // For recurring periods, check if day of week matches
            const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
            return period.daysOfWeek?.includes(dayOfWeek) ?? false;
          });
          
          return (
            <div 
              key={day.toISOString()} 
              className={`relative border-r ${
                isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              {hours.map((hour) => (
                <div 
                  key={hour} 
                  className="border-b border-dashed h-20"
                />
              ))}
              
              {/* Current time indicator */}
              {isToday(day) && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                  style={{ 
                    top: getHourPosition(
                      new Date().getHours() + ':' + 
                      (new Date().getMinutes() < 10 ? '0' : '') + 
                      new Date().getMinutes() + ' ' + 
                      (new Date().getHours() >= 12 ? 'PM' : 'AM')
                    ) 
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-1" />
                </div>
              )}
              
              {/* Periods for this day */}
              {dayPeriods.map((period) => (
                <PeriodBlock 
                  key={period.id} 
                  period={period} 
                  onClick={() => onPeriodClick(period)} 
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
