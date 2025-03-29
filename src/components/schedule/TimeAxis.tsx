
import React from 'react';
import { getHoursArray, getHourPosition } from '@/utils/scheduleUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TimeAxisProps {
  minHour: number;
  maxHour: number;
  heightPerHour?: number;
}

export const TimeAxis: React.FC<TimeAxisProps> = ({ minHour, maxHour, heightPerHour = 60 }) => {
  const isMobile = useIsMobile();
  const hours = getHoursArray(minHour, maxHour);
  
  return (
    <div className={`relative border-r ${isMobile ? 'w-12' : 'w-16'} h-full`}>
      <div className="sticky top-0 p-2 border-b bg-card text-center z-10 h-[60px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Time</div>
      </div>
      
      <div className="relative" style={{ height: `${(maxHour - minHour) * heightPerHour}px` }}>
        {hours.map((hour) => (
          <div 
            key={hour}
            className="absolute left-0 right-0 border-b border-dashed flex items-center"
            style={{ top: getHourPosition(hour, minHour, heightPerHour) }}
          >
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground bg-card px-1 -translate-y-1/2 ml-1`}>
              {isMobile ? hour.replace(':00', '') : hour}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
