
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { calculateHeight, calculateTopPosition, formatTime, getPeriodColor } from '@/utils/scheduleUtils';

interface PeriodBlockProps {
  period: Period;
  index?: number; // Add the index prop as optional
  onClick: () => void;
}

export const PeriodBlock: React.FC<PeriodBlockProps> = ({ period, onClick }) => {
  // Calculate height based on duration
  const height = calculateHeight(period.startTime, period.endTime);
  
  // Calculate top position based on start time
  const top = calculateTopPosition(period.startTime);
  
  // Get color class based on period type
  const colorClass = getPeriodColor(period.type);
  
  return (
    <div
      className={`absolute left-1 right-1 rounded-md p-2 shadow-sm cursor-pointer text-white
        border-l-4 z-10 overflow-hidden hover:shadow-md transition-shadow
        ${colorClass} ${period.isSpecialDay ? 'bg-opacity-70' : ''}`}
      style={{
        height,
        top,
      }}
      onClick={onClick}
    >
      <div className="h-full flex flex-col">
        <h3 className="font-medium text-sm truncate">{period.title}</h3>
        
        <div className="text-xs opacity-90 mt-0.5">
          {formatTime(period.startTime)} - {formatTime(period.endTime)}
        </div>
        
        {period.location && (
          <div className="text-xs mt-1 opacity-80 truncate">
            {period.location}
          </div>
        )}
        
        {period.notes && height.replace('px', '') > '100' && (
          <div className="text-xs mt-2 opacity-80 line-clamp-2">
            {period.notes}
          </div>
        )}
      </div>
    </div>
  );
};
