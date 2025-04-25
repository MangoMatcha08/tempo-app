
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UIReminder } from '@/types/reminderTypes';
import { Button } from '@/components/ui/button';
import { Check, Clock, CalendarIcon, Loader2 } from 'lucide-react';
import { formatTimeWithPeriod, getPriorityColorClass } from '@/utils/timeUtils';

interface ReminderCardProps {
  reminder: UIReminder;
  onComplete?: (id: string) => void;
  onEdit?: (reminder: UIReminder) => void;
  isPending?: boolean;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ 
  reminder, 
  onComplete, 
  onEdit,
  isPending = false
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = () => {
    if (reminder.id && onComplete && !isPending) {
      setIsCompleting(true);
      // Let the animation play before calling the completion handler
      setTimeout(() => {
        onComplete(reminder.id!);
      }, 300);
    }
  };

  const handleEdit = () => {
    if (onEdit && !isPending) {
      onEdit(reminder);
    }
  };

  // Get color class based on priority
  const priorityColorClass = getPriorityColorClass(reminder.priority);

  if (isCompleting) {
    return null; // Don't render anything if being completed
  }

  return (
    <Card className={`w-full transition-all duration-300 ${isPending ? 'opacity-80' : ''}`}>
      <CardContent className="flex flex-col p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${priorityColorClass} border`} variant="outline">
            {reminder.priority}
          </Badge>
          <div className="flex items-center space-x-2">
            {isPending && (
              <div className="flex items-center mr-2">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mr-1" />
                <span className="text-xs text-muted-foreground">Syncing</span>
              </div>
            )}
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {formatTimeWithPeriod(reminder.dueDate, reminder.periodId)}
            </span>
          </div>
        </div>
        <h3 className="text-lg font-semibold">{reminder.title}</h3>
        <p className="text-sm text-gray-500">{reminder.description}</p>
        <div className="flex justify-end mt-4 space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEdit}
            disabled={isPending}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            onClick={handleComplete} 
            disabled={isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderCard;
