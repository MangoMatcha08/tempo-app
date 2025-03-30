import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import CurrentPeriodIndicator from "@/components/dashboard/CurrentPeriodIndicator";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import RemindersSection from "@/components/dashboard/RemindersSection";
import ProgressVisualization from "@/components/dashboard/ProgressVisualization";
import CompletedRemindersSection from "@/components/dashboard/CompletedRemindersSection";
import QuickReminderModal from "@/components/dashboard/QuickReminderModal";
import VoiceRecorderModal from "@/components/dashboard/VoiceRecorderModal";

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  location?: string;
  completed?: boolean;
  completedAt?: Date;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);
  
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

  const handleSignOut = async () => {
    const { success, error } = await signOutUser();
    
    if (success) {
      navigate("/");
    } else {
      console.error("Sign out failed:", error?.message);
    }
  };

  const navigateToSchedule = () => {
    navigate("/schedule");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Tempo Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={navigateToSchedule}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <span className="text-sm text-muted-foreground">
            {user?.displayName || user?.email}
          </span>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
      
      <CurrentPeriodIndicator />
      <QuickActionsBar 
        onNewReminder={() => setShowQuickReminderModal(true)}
        onNewVoiceNote={() => setShowVoiceRecorderModal(true)}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary content - 2/3 width on desktop */}
        <div className="md:col-span-2 space-y-6">
          <RemindersSection 
            urgentReminders={urgentReminders} 
            upcomingReminders={upcomingReminders} 
            onCompleteReminder={handleCompleteReminder}
          />
          <ProgressVisualization />
        </div>
        
        {/* Secondary content - 1/3 width on desktop */}
        <div>
          <CompletedRemindersSection 
            reminders={completedReminders}
            onUndoComplete={handleUndoComplete}
          />
        </div>
      </div>
      
      {/* Modals */}
      <QuickReminderModal
        open={showQuickReminderModal}
        onOpenChange={setShowQuickReminderModal}
      />
      
      <VoiceRecorderModal
        open={showVoiceRecorderModal}
        onOpenChange={setShowVoiceRecorderModal}
      />
    </div>
  );
};

export default Dashboard;
