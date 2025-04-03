import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useSchedule } from '@/hooks/useSchedule';
import { WeeklyCalendar } from './WeeklyCalendar';
import { ScheduleToolbar } from './ScheduleToolbar';
import { PeriodEditor } from './PeriodEditor';
import { Period } from '@/contexts/ScheduleContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { DayDetailView } from './DayDetailView';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("ScheduleView");

export const ScheduleView: React.FC = () => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const { 
    periods,
    loading, 
    error,
    getPeriodsForDay,
    updatePeriod,
    deletePeriod,
    getDaysOfWeek,
    resetToDefaultSchedule
  } = useSchedule();
  
  useEffect(() => {
    debugLog(`Loaded ${periods.length} periods for schedule view`);
    periods.forEach(period => {
      debugLog(`Period: ${period.title}, Time: ${format(period.startTime, 'h:mm a')} - ${format(period.endTime, 'h:mm a')}`);
    });
  }, [periods]);
  
  const handlePeriodClick = (period: Period, displayDay: Date) => {
    setSelectedDay(displayDay);
    setIsDayDetailOpen(true);
    debugLog(`Selected day: ${selectedDay ? format(selectedDay, 'EEEE, MMMM d') : 'none'}`);
  };
  
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsDayDetailOpen(true);
  };
  
  const handleSavePeriod = (periodData: Partial<Period>) => {
    if (selectedPeriod) {
      updatePeriod(selectedPeriod.id, periodData);
    }
    setIsEditorOpen(false);
  };
  
  const handleDeletePeriod = () => {
    if (selectedPeriod) {
      deletePeriod(selectedPeriod.id);
    }
    setIsEditorOpen(false);
  };
  
  const handleResetSchedule = () => {
    debugLog("Resetting to default schedule");
    resetToDefaultSchedule();
  };
  
  if (loading) {
    return (
      <Card className="p-3">
        <div className="flex justify-center items-center h-16">
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-3">
        <div className="flex justify-center items-center h-16">
          <p className="text-destructive">Error loading schedule: {error.message}</p>
        </div>
      </Card>
    );
  }

  const dayPeriods = selectedDay ? getPeriodsForDay(selectedDay) : [];
  
  return (
    <div className="flex flex-col h-full space-y-2">
      <div className="flex justify-between items-center">
        <ScheduleToolbar 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onAddPeriod={() => {}}
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResetSchedule}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Reset
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <WeeklyCalendar 
          daysOfWeek={getDaysOfWeek(selectedDate)}
          periods={periods}
          onPeriodClick={handlePeriodClick}
          onDayClick={handleDayClick}
        />
      </div>
      
      <DayDetailView
        isOpen={isDayDetailOpen}
        onClose={() => setIsDayDetailOpen(false)}
        day={selectedDay}
        periods={dayPeriods}
      />
      
      {isEditorOpen && (
        <PeriodEditor
          period={selectedPeriod}
          onSave={handleSavePeriod}
          onDelete={handleDeletePeriod}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};
