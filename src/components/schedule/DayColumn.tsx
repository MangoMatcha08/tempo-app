
import React from 'react';
import { Period } from '@/contexts/ScheduleContext';
import { PeriodBlock } from './PeriodBlock';
import { formatDateShort, formatDayShort } from '@/utils/scheduleUtils';
import { isToday } from 'date-fns';

interface DayColumnProps {
  day: Date;
  periods: Period[];
  onPeriodClick: (period: Period) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  periods,
  onPeriodClick
}) => {
  const isTodayFlag = isToday(day);

  return (
    <div className={`relative border-r min-h-[1440px] ${
      isTodayFlag ? 'bg-blue-50 dark:bg-blue-900/20' : ''
    }`}>
      <div className={`sticky top-0 p-3 text-center border-b ${
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
        />
      ))}
    </div>
  );
};
