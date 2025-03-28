
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
    <div className={`relative border-r ${
      isTodayFlag ? 'bg-blue-50 dark:bg-blue-900/20' : ''
    } ${isMobile ? 'min-w-[130px]' : ''}`}>
      <div className={`sticky top-0 p-2 text-center border-b z-10 ${
        isTodayFlag ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-card'
      }`}>
        <div className="font-medium">{formatDayShort(day)}</div>
        <div className="text-sm text-muted-foreground">{formatDateShort(day)}</div>
      </div>
      
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
  );
};
