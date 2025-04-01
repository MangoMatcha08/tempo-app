
import { useState, useEffect } from "react";
import { useReminders } from "@/hooks/useReminders";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardModals from "@/components/dashboard/DashboardModals";
import { Reminder as ReminderType } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";
import { useToast } from "@/hooks/use-toast";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Home, Settings as SettingsIcon, Calendar } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { convertToUIReminder, convertToBackendReminder } from "@/utils/typeUtils";

const Dashboard = () => {
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Initialize sidebar after a short delay to prevent conflicts with notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const {
    reminders,
    loading,
    urgentReminders,
    upcomingReminders,
    completedReminders,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder
  } = useReminders();

  // Debug log to check if reminders are being fetched
  useEffect(() => {
    console.log("Dashboard reminders:", reminders);
    console.log("Urgent reminders:", urgentReminders);
    console.log("Upcoming reminders:", upcomingReminders);
  }, [reminders, urgentReminders, upcomingReminders]);

  // Convert reminders to UI-compatible format
  const convertedUrgentReminders = urgentReminders.map(convertToUIReminder);
  const convertedUpcomingReminders = upcomingReminders.map(convertToUIReminder);
  const convertedCompletedReminders = completedReminders.map(convertToUIReminder);

  const handleReminderCreated = (reminder: UIReminder) => {
    // Convert UI reminder to backend reminder type
    const backendReminder = convertToBackendReminder(reminder);
    
    // Add the new reminder to the list
    addReminder(backendReminder)
      .then((savedReminder) => {
        console.log("Reminder saved successfully:", savedReminder);
        toast({
          title: "Reminder Created",
          description: `"${reminder.title}" has been added to your reminders.`
        });
      })
      .catch(error => {
        console.error("Error saving reminder:", error);
        toast({
          title: "Error Saving Reminder",
          description: "There was a problem saving your reminder.",
          variant: "destructive"
        });
      });
  };

  const handleReminderUpdated = (reminder: UIReminder) => {
    // Convert UI reminder to backend reminder type
    const backendReminder = convertToBackendReminder(reminder);
    
    // Update the reminder in the list
    updateReminder(backendReminder);
    
    toast({
      title: "Reminder Updated",
      description: `"${reminder.title}" has been updated.`
    });
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!sidebarReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarHeader className="flex justify-center items-center py-4 bg-sidebar">
            <h2 className="text-lg font-bold">Tempo</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate('/dashboard')} 
                      isActive={isActive('/dashboard')}
                      tooltip="Dashboard"
                    >
                      <Home />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate('/schedule')} 
                      isActive={isActive('/schedule')}
                      tooltip="Schedule"
                    >
                      <Calendar />
                      <span>Schedule</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate('/settings')} 
                      isActive={isActive('/settings')}
                      tooltip="Settings"
                    >
                      <SettingsIcon />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="container mx-auto px-2 sm:px-4 py-6 max-w-5xl relative">
              {isMobile && (
                <div className="absolute top-2 left-2 z-10">
                  <SidebarTrigger className="bg-background shadow-sm" />
                </div>
              )}
              <div className={isMobile ? "pt-8" : ""}>
                <DashboardHeader title="Tempo Dashboard" />
                
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2">Loading reminders...</span>
                  </div>
                ) : (
                  <DashboardContent 
                    urgentReminders={convertedUrgentReminders}
                    upcomingReminders={convertedUpcomingReminders}
                    completedReminders={convertedCompletedReminders}
                    onCompleteReminder={handleCompleteReminder}
                    onUndoComplete={handleUndoComplete}
                    onNewReminder={() => setShowQuickReminderModal(true)}
                    onNewVoiceNote={() => setShowVoiceRecorderModal(true)}
                    onUpdateReminder={handleReminderUpdated}
                  />
                )}
                
                <DashboardModals 
                  showQuickReminderModal={showQuickReminderModal}
                  setShowQuickReminderModal={setShowQuickReminderModal}
                  showVoiceRecorderModal={showVoiceRecorderModal}
                  setShowVoiceRecorderModal={setShowVoiceRecorderModal}
                  onReminderCreated={handleReminderCreated}
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
