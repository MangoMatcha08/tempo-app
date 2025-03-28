
import React from 'react';
import { ScheduleView } from '@/components/schedule/ScheduleView';

const Schedule = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Class Schedule</h1>
      <ScheduleView />
    </div>
  );
};

export default Schedule;
