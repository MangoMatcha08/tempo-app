
import React from 'react';
import { CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReminderHeaderProps } from './types';

/**
 * Header component for the reminder form
 * Displays the title and view mode toggle
 */
const ReminderHeader: React.FC<ReminderHeaderProps> = ({ 
  viewMode, 
  toggleViewMode 
}) => {
  return (
    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xl">Create Reminder</CardTitle>
      <div className="flex items-center space-x-2">
        <Label htmlFor="view-mode" className="text-sm">
          {viewMode === 'simple' ? 'Simple' : 'Detailed'}
        </Label>
        <Switch
          id="view-mode"
          checked={viewMode === 'detailed'}
          onCheckedChange={toggleViewMode}
        />
      </div>
    </div>
  );
};

export default ReminderHeader;
