
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reminder } from '@/types/reminder';
import { Button } from '@/components/ui/button';
import { Check, Clock, CalendarIcon } from 'lucide-react';
import { formatTimeWithPeriod, getPriorityColorClass } from '@/utils/timeUtils';

interface ReminderCardProps {
  reminder: Reminder;
  onComplete?: (id: string) => void;
  onEdit?: (reminder: Reminder) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onComplete, onEdit }) => {
  const handleComplete = () => {
    if (reminder.id && onComplete) {
      onComplete(reminder.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(reminder);
    }
  };

  // Get color class based on priority
  const priorityColorClass = getPriorityColorClass(reminder.priority);

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${priorityColorClass} border`} variant="outline">
            {reminder.priority}
          </Badge>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {formatTimeWithPeriod(reminder.dueDate)}
            </span>
          </div>
        </div>
        <h3 className="text-lg font-semibold">{reminder.title}</h3>
        <p className="text-sm text-gray-500">{reminder.description}</p>
        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            Edit
          </Button>
          <Button size="sm" onClick={handleComplete}>
            <Check className="h-4 w-4 mr-2" />
            Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderCard;
