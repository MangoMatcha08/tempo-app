
import { useState } from "react";
import { Reminder } from "@/types/reminder";
import { v4 as uuidv4 } from 'uuid';

export function useReminders() {
  // Mock data for reminders - in a real app, this would come from a database
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: "1",
      title: "Submit Grades",
      description: "End of quarter grades due today",
      dueDate: new Date(new Date().getTime() + 3600000), // 1 hour from now
      priority: "high",
      location: "Math 101",
      completed: false,
    },
    {
      id: "2",
      title: "Parent Conference",
      description: "Meeting with Johnson family",
      dueDate: new Date(new Date().getTime() + 1800000), // 30 mins from now
      priority: "medium",
      location: "Conference Room",
      completed: false,
    },
    {
      id: "3",
      title: "Order Lab Supplies",
      description: "For next month's experiments",
      dueDate: new Date(new Date().getTime() + 86400000), // Tomorrow
      priority: "low",
      completed: false,
    },
    {
      id: "4",
      title: "Staff Meeting",
      description: "Curriculum planning",
      dueDate: new Date(new Date().getTime() + 172800000), // Day after tomorrow
      priority: "medium",
      completed: false,
    },
    {
      id: "5",
      title: "Grade Essays",
      description: "English class essays",
      dueDate: new Date(new Date().getTime() + 259200000), // 3 days from now
      priority: "medium",
      completed: false,
    },
    {
      id: "6",
      title: "Complete Paperwork",
      description: "Administrative forms due last week",
      dueDate: new Date(new Date().getTime() - 259200000), // 3 days ago
      priority: "high",
      completed: true,
      completedAt: new Date(new Date().getTime() - 86400000), // 1 day ago
    },
    {
      id: "7",
      title: "Call IT Support",
      description: "About the projector issue",
      dueDate: new Date(new Date().getTime() - 172800000), // 2 days ago
      priority: "medium",
      completed: true,
      completedAt: new Date(new Date().getTime() - 86400000), // 1 day ago
    }
  ]);

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);
  
  // Urgent reminders are due within the next 2 hours
  const urgentReminders = activeReminders.filter(reminder => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 7200000);
    return reminder.dueDate <= twoHoursFromNow;
  });
  
  // Upcoming reminders are all other active reminders
  const upcomingReminders = activeReminders.filter(reminder => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 7200000);
    return reminder.dueDate > twoHoursFromNow;
  });
  
  const handleCompleteReminder = (id: string) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, completed: true, completedAt: new Date() } 
          : reminder
      )
    );
  };
  
  const handleUndoComplete = (id: string) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, completed: false, completedAt: undefined } 
          : reminder
      )
    );
  };
  
  const addReminder = (reminder: Reminder) => {
    // Ensure the reminder has a unique ID
    const newReminder = {
      ...reminder,
      id: reminder.id || uuidv4()
    };
    
    console.log("Adding reminder:", newReminder);
    setReminders(prev => [newReminder, ...prev]);
    return newReminder;
  };

  const updateReminder = (updatedReminder: Reminder) => {
    console.log("Updating reminder:", updatedReminder);
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === updatedReminder.id 
          ? { ...updatedReminder } 
          : reminder
      )
    );
    return updatedReminder;
  };

  return {
    reminders,
    urgentReminders,
    upcomingReminders,
    completedReminders,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder
  };
}
