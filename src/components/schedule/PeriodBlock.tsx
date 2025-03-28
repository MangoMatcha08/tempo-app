
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { calculateHeight, calculateTopPosition, formatTime, getPeriodColor } from '@/utils/scheduleUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PeriodBlockProps {
  period: Period;
  index?: number;
  onClick: () => void;
  minHour: number;
  heightPerHour?: number;
}

export const PeriodBlock: React.FC<PeriodBlockProps> = ({ 
  period, 
  onClick, 
  minHour,
  heightPerHour = 60
}) => {
  const isMobile = useIsMobile();
  
  // Calculate height based on duration
  const height = calculateHeight(period.startTime, period.endTime, heightPerHour);
  
  // Calculate top position based on start time and minHour offset
  const top = calculateTopPosition(period.startTime, minHour, heightPerHour);
  
  // Get color class based on period type
  const colorClass = getPeriodColor(period.type);
  
  return (
    <div
      className={`absolute left-1 right-1 rounded-md p-1.5 shadow-sm cursor-pointer text-white
        border-l-4 z-10 overflow-hidden hover:shadow-md transition-shadow
        ${colorClass} ${period.isSpecialDay ? 'bg-opacity-70' : ''}`}
      style={{
        height,
        top,
      }}
      onClick={onClick}
    >
      <div className="h-full flex flex-col">
        <h3 className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>{period.title}</h3>
        
        <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} opacity-90 mt-0.5`}>
          {formatTime(period.startTime)} - {formatTime(period.endTime)}
        </div>
        
        {period.location && (
          <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} mt-0.5 opacity-80 truncate`}>
            {period.location}
          </div>
        )}
        
        {period.notes && height.replace('px', '') > (isMobile ? '60' : '80') && (
          <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} mt-1 opacity-80 line-clamp-1`}>
            {period.notes}
          </div>
        )}
      </div>
    </div>
  );
};
