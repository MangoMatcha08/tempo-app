
import React from 'react';
import { getHoursArray, getHourPosition } from '@/utils/scheduleUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TimeAxisProps {
  minHour: number;
  maxHour: number;
}

export const TimeAxis: React.FC<TimeAxisProps> = ({ minHour, maxHour }) => {
  const isMobile = useIsMobile();
  const hours = getHoursArray(minHour, maxHour);
  
  return (
    <div className={`relative border-r ${isMobile ? 'w-10' : 'w-16'}`}>
      <div className="sticky top-0 p-2 border-b bg-card text-center z-10">
        <div className="text-sm text-muted-foreground">Time</div>
      </div>
      
      {hours.map((hour) => (
        <div 
          key={hour}
          className="absolute left-0 right-0 border-b border-dashed flex items-center h-[1px]"
          style={{ top: getHourPosition(hour, minHour) }}
        >
          <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground bg-card px-1 -mt-2 ml-1`}>
            {isMobile ? hour.replace(':00', '').replace(' ', '') : hour}
          </span>
        </div>
      ))}
    </div>
  );
};
