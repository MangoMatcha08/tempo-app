
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const RemindersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Reminder
        </Button>
      </div>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Class Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Take attendance for Period 3</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">3:00 PM</span>
              <Button variant="ghost" size="sm">Mark Complete</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Grade Papers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Complete grading for Unit 5 quiz</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">By Tomorrow</span>
              <Button variant="ghost" size="sm">Mark Complete</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RemindersPage;
