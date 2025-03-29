
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
  minHour: number;
  maxHour: number;
  heightPerHour?: number;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  periods,
  onPeriodClick,
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
      <div className={`sticky top-0 p-2 text-center border-b z-10 ${
        isTodayFlag ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-card'
      }`}>
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
