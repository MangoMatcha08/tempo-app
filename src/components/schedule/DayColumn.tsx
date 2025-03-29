
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { PeriodBlock } from './PeriodBlock';
import { formatDateShort, formatDayShort } from '@/utils/scheduleUtils';
import { isToday } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface DayColumnProps {
  day: Date;
  periods: Period[];
  onPeriodClick: (period: Period) => void;
  onDayClick: (day: Date) => void;
  minHour: number;
  maxHour: number;
  heightPerHour?: number;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  periods,
  onPeriodClick,
  onDayClick,
  minHour,
  maxHour,
  heightPerHour = 60
}) => {
  const isMobile = useIsMobile();
  const isTodayFlag = isToday(day);
  
  return (
    <div className={`relative border-r h-full ${
      isTodayFlag ? 'bg-blue-50 dark:bg-blue-900/20' : ''
    } ${isMobile ? 'min-w-[120px]' : ''}`}>
      <div 
        className={`sticky top-0 p-2 text-center border-b z-20 h-[60px] flex flex-col justify-center ${
          isTodayFlag ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-card'
        } cursor-pointer hover:bg-accent transition-colors`}
        onClick={() => onDayClick(day)}
      >
        <div className="font-medium">{formatDayShort(day)}</div>
        <div className="text-sm text-muted-foreground">{formatDateShort(day)}</div>
      </div>
      
      <div className="relative" style={{ height: `${(maxHour - minHour) * heightPerHour}px` }}>
        {periods.map((period, index) => (
          <PeriodBlock 
            key={period.id} 
            period={period}
            index={index}
            onClick={() => onPeriodClick(period)}
            minHour={minHour}
            heightPerHour={heightPerHour}
          />
        ))}
      </div>
    </div>
  );
};
