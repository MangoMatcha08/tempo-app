
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useSchedule } from '@/hooks/useSchedule';
import { WeeklyCalendar } from './WeeklyCalendar';
import { ScheduleToolbar } from './ScheduleToolbar';
import { PeriodEditor } from './PeriodEditor';
import { Period } from '@/contexts/ScheduleContext';
import { useIsMobile } from '@/hooks/use-mobile';

export const ScheduleView: React.FC = () => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  
  const { 
    periods,
    loading, 
    error,
    getPeriodsForDay,
    updatePeriod,
    deletePeriod,
    getDaysOfWeek
  } = useSchedule();
  
  const handlePeriodClick = (period: Period) => {
    setSelectedPeriod(period);
    setIsEditorOpen(true);
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
  
  return (
    <div className="flex flex-col h-full space-y-2">
      <ScheduleToolbar 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onAddPeriod={() => {}}
      />
      
      <div className="flex-1 overflow-hidden">
        <WeeklyCalendar 
          daysOfWeek={getDaysOfWeek(selectedDate)}
          periods={periods}
          onPeriodClick={handlePeriodClick}
        />
      </div>
      
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
