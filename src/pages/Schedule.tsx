
import React from 'react';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Schedule = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className={`container mx-auto ${isMobile ? 'px-1 py-2' : 'px-4 py-6'} max-w-[1200px] h-[calc(100vh-3rem)]`}>
      <div className="flex justify-between items-center mb-3">
        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>Class Schedule</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
          size={isMobile ? "sm" : "default"}
        >
          <Home className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          Dashboard
        </Button>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <ScheduleView />
      </div>
    </div>
  );
};

export default Schedule;
