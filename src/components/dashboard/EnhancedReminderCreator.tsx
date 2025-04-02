
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { ReminderCategory, ReminderPriority } from "@/types/reminderTypes";
import { createReminder } from "@/utils/reminderUtils";
import { useToast } from "@/hooks/use-toast";

interface EnhancedReminderCreatorProps {
  onReminderCreated: (reminder: any) => void;
  onCancel: () => void;
}

const EnhancedReminderCreator = ({ onReminderCreated, onCancel }: EnhancedReminderCreatorProps) => {
  const [activeTab, setActiveTab] = useState("simple");
  const { toast } = useToast();
  
  const { handleSubmit, control, register, formState: { errors, isDirty }, reset, watch } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: ReminderCategory.TASK,
      priority: ReminderPriority.MEDIUM,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      periodId: ""
    }
  });
  
  const onSubmit = (data: any) => {
    try {
      // Create the reminder with the form data
      const reminder = createReminder({
        title: data.title,
        description: data.description || "",
        category: data.category,
        priority: data.priority,
        dueDate: data.dueDate,
        periodId: data.periodId || undefined
      });
      
      // Call the callback with the new reminder
      onReminderCreated(reminder);
      
      // Reset the form
      reset();
      
      // Show success toast
      toast({
        title: "Reminder created",
        description: "Your reminder has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating reminder:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "There was an error creating your reminder.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Create Reminder</h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onCancel}
        >
          <XCircle className="h-5 w-5" />
        </Button>
      </div>
      
      <Tabs defaultValue="simple" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="simple">Simple</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <TabsContent value="simple" className="space-y-4 pt-2">
            <div>
              <Controller
                name="title"
                control={control}
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <Input
                    placeholder="What do you need to do?"
                    {...field}
                    className={cn(errors.title && "border-red-500")}
                  />
                )}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message?.toString()}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
                        <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div>
                <Controller
                  name="periodId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Period (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Period</SelectItem>
                        <SelectItem value="1">Period 1</SelectItem>
                        <SelectItem value="2">Period 2</SelectItem>
                        <SelectItem value="3">Period 3</SelectItem>
                        <SelectItem value="4">Period 4</SelectItem>
                        <SelectItem value="5">Period 5</SelectItem>
                        <SelectItem value="6">Period 6</SelectItem>
                        <SelectItem value="7">Period 7</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Create Reminder</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="detailed" className="space-y-4 pt-2">
            <div>
              <Label htmlFor="title">Title</Label>
              <Controller
                name="title"
                control={control}
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <Input
                    id="title"
                    placeholder="What do you need to do?"
                    {...field}
                    className={cn(errors.title && "border-red-500")}
                  />
                )}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message?.toString()}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="description"
                    placeholder="Add details about this reminder..."
                    className="min-h-[80px]"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReminderCategory.TASK}>Task</SelectItem>
                        <SelectItem value={ReminderCategory.MEETING}>Meeting</SelectItem>
                        <SelectItem value={ReminderCategory.DEADLINE}>Deadline</SelectItem>
                        <SelectItem value={ReminderCategory.PREPARATION}>Preparation</SelectItem>
                        <SelectItem value={ReminderCategory.GRADING}>Grading</SelectItem>
                        <SelectItem value={ReminderCategory.COMMUNICATION}>Communication</SelectItem>
                        <SelectItem value={ReminderCategory.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
                        <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="periodId">Period (Optional)</Label>
                <Controller
                  name="periodId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger id="periodId">
                        <SelectValue placeholder="Select Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Period</SelectItem>
                        <SelectItem value="1">Period 1</SelectItem>
                        <SelectItem value="2">Period 2</SelectItem>
                        <SelectItem value="3">Period 3</SelectItem>
                        <SelectItem value="4">Period 4</SelectItem>
                        <SelectItem value="5">Period 5</SelectItem>
                        <SelectItem value="6">Period 6</SelectItem>
                        <SelectItem value="7">Period 7</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Create Reminder</Button>
            </div>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
};

export default EnhancedReminderCreator;
