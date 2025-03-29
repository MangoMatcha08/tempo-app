
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { calculateHeight, calculateTopPosition, getPeriodColor } from '@/utils/scheduleUtils';
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

  // Ensure we always have a valid reminderCount
  // The check is simplified to better handle different cases
  const hasNotes = period.notes && period.notes.trim().length > 0;
  const reminderCount = hasNotes ? Math.min(Math.ceil(period.notes.length / 20), 5) : 0;
  
  return (
    <div
      className={`absolute left-1 right-1 rounded-md p-1.5 shadow-sm cursor-pointer text-white
        border-l-4 z-10 overflow-hidden hover:shadow-md transition-shadow
        ${colorClass} ${period.isSpecialDay ? 'bg-opacity-70' : ''}`}
      style={{
        height,
        top: `calc(${top} + 0px)`,
      }}
      onClick={onClick}
    >
      <div className="h-full flex flex-col justify-between">
        <h3 className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} truncate flex-1`}>
          {period.title}
        </h3>

        {/* Reminder indicators - Force display when there are notes */}
        {hasNotes && (
          <div className="flex mt-1 gap-1">
            {Array.from({ length: reminderCount }).map((_, i) => (
              <div 
                key={i} 
                className="h-1.5 rounded-full" 
                style={{ 
                  backgroundColor: getReminderColor(i),
                  width: i === 0 ? '30%' : `${Math.max(10, 30 - i * 5)}%`,
                  opacity: 0.9
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get colors for reminder indicators
function getReminderColor(index: number): string {
  const colors = [
    '#0EA5E9', // Ocean Blue
    '#F97316', // Bright Orange
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#ea384c', // Red
  ];
  
  return colors[index % colors.length];
}
