import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { ReminderPriority, ReminderCategory, CreateReminderInput } from '@/types/reminderTypes';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { mockPeriods, createReminder } from '@/utils/reminderUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { v4 as uuidv4 } from 'uuid';
import { Reminder as UIReminder } from '@/types/reminder';
import { convertToUIReminder } from '@/utils/typeUtils';
import { parseTimeString, createDateWithTime, adjustDateIfPassed, logDateDetails } from '@/utils/dateTimeUtils';

interface EnhancedReminderCreatorProps {
  onReminderCreated?: (reminder: UIReminder) => void;
  onCancel?: () => void;
}

const EnhancedReminderCreator: React.FC<EnhancedReminderCreatorProps> = ({ 
  onReminderCreated,
  onCancel 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date()); // Default to today
  const [dueTime, setDueTime] = useState<string | undefined>(undefined);
  const [checklist, setChecklist] = useState<{ id: string, text: string, isCompleted: boolean }[]>([]);
  
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [showChecklist, setShowChecklist] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  useEffect(() => {
    setDueDate(new Date());
  }, []);
  
  const toggleViewMode = () => {
    setViewMode(viewMode === 'simple' ? 'detailed' : 'simple');
  };
  
  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([
        ...checklist,
        { id: uuidv4(), text: newChecklistItem, isCompleted: false }
      ]);
      setNewChecklistItem('');
    }
  };
  
  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };
  
  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };
  
  const handleCreateReminder = () => {
    if (!title.trim()) return;
    
    console.log('[EnhancedReminderCreator] Creating reminder:', {
      title,
      dueDate,
      dueTime,
      periodId
    });
    
    const reminderInput: CreateReminderInput = {
      title,
      description,
      priority,
      category,
      periodId,
      checklist: checklist.length > 0 ? checklist : undefined,
    };
    
    let finalDueDate = dueDate ? new Date(dueDate) : new Date();
    logDateDetails('Initial dueDate', finalDueDate);
    
    if (periodId) {
      const selectedPeriod = mockPeriods.find(p => p.id === periodId);
      console.log('[EnhancedReminderCreator] Selected period:', selectedPeriod);
      
      if (selectedPeriod && selectedPeriod.startTime) {
        const [hours, minutes] = selectedPeriod.startTime.split(':').map(Number);
        console.log(`[EnhancedReminderCreator] Period time: ${hours}:${minutes}`);
        
        finalDueDate = createDateWithTime(finalDueDate, hours, minutes);
        finalDueDate = adjustDateIfPassed(finalDueDate);
        
        logDateDetails('Final dueDate after period time applied', finalDueDate);
      }
    }
    else if (dueTime) {
      console.log(`[EnhancedReminderCreator] Processing time string: "${dueTime}"`);
      const { hours, minutes } = parseTimeString(dueTime);
      console.log(`[EnhancedReminderCreator] Parsed time: ${hours}:${minutes}`);
      
      finalDueDate = createDateWithTime(finalDueDate, hours, minutes);
      finalDueDate = adjustDateIfPassed(finalDueDate);
      
      logDateDetails('Final dueDate after time string applied', finalDueDate);
    }
    
    const newReminder = createReminder({
      ...reminderInput,
      dueDate: finalDueDate
    });
    
    console.log('[EnhancedReminderCreator] Created reminder:', newReminder);
    
    const uiReminder = convertToUIReminder(newReminder);
    
    if (onReminderCreated) {
      onReminderCreated(uiReminder);
    }
    
    resetForm();
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(ReminderPriority.MEDIUM);
    setCategory(ReminderCategory.TASK);
    setPeriodId(undefined);
    setDueDate(new Date()); // Reset to today
    setDueTime(undefined);
    setChecklist([]);
    setNewChecklistItem('');
    setShowChecklist(false);
    setViewMode('simple');
  };
  
  return (
    <Card className="enhanced-reminder-creator w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="What do you need to remember?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as ReminderPriority)}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
                <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ReminderCategory)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ReminderCategory.TASK}>Task</SelectItem>
                <SelectItem value={ReminderCategory.MEETING}>Meeting</SelectItem>
                <SelectItem value={ReminderCategory.DEADLINE}>Deadline</SelectItem>
                <SelectItem value={ReminderCategory.PREPARATION}>Preparation</SelectItem>
                <SelectItem value={ReminderCategory.GRADING}>Grading</SelectItem>
                <SelectItem value={ReminderCategory.COMMUNICATION}>Communication</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="period">Period</Label>
          <Select 
            value={periodId || 'none'} 
            onValueChange={(value) => setPeriodId(value === 'none' ? undefined : value)}
          >
            <SelectTrigger id="period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific period</SelectItem>
              {mockPeriods.map(period => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name} ({period.startTime} - {period.endTime})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {viewMode === 'detailed' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add more details about this reminder"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <DatePicker 
                  date={dueDate} 
                  setDate={setDueDate} 
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Due Time</Label>
                <TimePicker 
                  value={dueTime} 
                  onChange={setDueTime} 
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Collapsible>
                <div className="flex items-center justify-between">
                  <Label>Checklist</Label>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowChecklist(!showChecklist)}
                    >
                      {showChecklist ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="space-y-2 pl-2 mt-2 border-l-2 border-muted">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`checklist-${item.id}`}
                          checked={item.isCompleted}
                          onCheckedChange={() => toggleChecklistItem(item.id)}
                        />
                        <Label htmlFor={`checklist-${item.id}`} className="flex-1 font-normal">
                          {item.text}
                        </Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeChecklistItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add checklist item"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addChecklistItem();
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addChecklistItem}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={resetForm}
        >
          Clear
        </Button>
        <Button 
          onClick={handleCreateReminder}
          disabled={!title.trim()}
        >
          Create Reminder
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedReminderCreator;
