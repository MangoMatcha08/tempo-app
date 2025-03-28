
import React from 'react';
import { getHoursArray, getHourPosition } from '@/utils/scheduleUtils';

export const TimeAxis: React.FC = () => {
  const hours = getHoursArray();
  
  return (
    <div className="relative border-r w-16 min-h-[1440px]">
      <div className="sticky top-0 p-3 border-b bg-card text-center">
        <div className="text-sm text-muted-foreground">Time</div>
      </div>
      
      {hours.map((hour) => (
        <div 
          key={hour}
          className="absolute left-0 right-0 border-b border-dashed flex items-center h-[1px]"
          style={{ top: getHourPosition(hour) }}
        >
          <span className="text-xs text-muted-foreground bg-card px-1 -mt-2 ml-1">
            {hour}
          </span>
        </div>
      ))}
    </div>
  );
};
