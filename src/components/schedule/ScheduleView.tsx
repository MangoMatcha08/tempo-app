
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useSchedule } from '@/hooks/useSchedule';
import { WeeklyCalendar } from './WeeklyCalendar';
import { ScheduleToolbar } from './ScheduleToolbar';
import { PeriodEditor } from './PeriodEditor';
import { Period } from '@/contexts/ScheduleContext';

export const ScheduleView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  
  const { 
    periods,
    loading, 
    error,
    getPeriodsForDay,
    addPeriod,
    updatePeriod,
    deletePeriod,
    getDaysOfWeek
  } = useSchedule();
  
  const handlePeriodClick = (period: Period) => {
    setSelectedPeriod(period);
    setIsEditorOpen(true);
  };
  
  const handleAddPeriod = () => {
    setSelectedPeriod(null);
    setIsEditorOpen(true);
  };
  
  const handleSavePeriod = (periodData: Partial<Period>) => {
    if (selectedPeriod) {
      updatePeriod(selectedPeriod.id, periodData);
    } else {
      addPeriod(periodData as Omit<Period, 'id'>);
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
      <Card className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-destructive">Error loading schedule: {error.message}</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <ScheduleToolbar 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onAddPeriod={handleAddPeriod}
      />
      
      <Card>
        <WeeklyCalendar 
          daysOfWeek={getDaysOfWeek(selectedDate)}
          periods={periods}
          onPeriodClick={handlePeriodClick}
        />
      </Card>
      
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
