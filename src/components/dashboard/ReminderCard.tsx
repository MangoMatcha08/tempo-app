
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UIReminder } from '@/types/reminderTypes';
import { Button } from '@/components/ui/button';
import { Check, Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getPeriodNameById } from '@/utils/reminderUtils';
import { formatFirestoreDateWithPeriod } from '@/lib/firebase/dateUtils';
import { normalizePriority } from '@/utils/typeUtils';

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
      onComplete(reminder.id);
    }
  };

  const handleEdit = () => {
    if (onEdit && !isPending) {
      onEdit(reminder);
    }
  };
  
  // Normalize priority to handle legacy formats
  const normalizedPriority = normalizePriority(reminder.priority);

  const priorityColorClass = normalizedPriority === 'high' 
    ? 'text-red-500 bg-red-50' 
    : normalizedPriority === 'medium'
    ? 'text-yellow-500 bg-yellow-50'
    : 'text-green-500 bg-green-50';

  if (isCompleting) {
    return null;
  }

  const formattedDate = format(reminder.dueDate, 'MMM d');
  
  // Use the updated utility to format the time with period if available
  const formattedTime = formatFirestoreDateWithPeriod(
    reminder,
    'dueDate',
    'periodId',
    getPeriodNameById
  );

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
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs text-muted-foreground ml-1">Syncing</span>
              </div>
            )}
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              <span data-testid="reminder-date">{formattedDate}</span>
              {' '}
              <span data-testid="reminder-time">{formattedTime}</span>
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
            data-testid="complete-button"
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
