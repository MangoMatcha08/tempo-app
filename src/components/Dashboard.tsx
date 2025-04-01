
import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardModals from "@/components/dashboard/DashboardModals";
import { Reminder } from "@/types/reminderTypes";
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

const Dashboard = () => {
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const {
    urgentReminders,
    upcomingReminders,
    completedReminders,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder
  } = useReminders();

  const handleReminderCreated = (reminder: Reminder) => {
    // Add the new reminder to the list
    addReminder(reminder);
    
    toast({
      title: "Reminder Created",
      description: `"${reminder.title}" has been added to your reminders.`
    });
  };

  const handleReminderUpdated = (reminder: Reminder) => {
    // Update the reminder in the list
    updateReminder(reminder);
    
    toast({
      title: "Reminder Updated",
      description: `"${reminder.title}" has been updated.`
    });
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarHeader className="flex justify-center items-center py-4">
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
        
        <SidebarInset>
          <div className="container mx-auto px-2 sm:px-4 py-6 max-w-5xl relative">
            {isMobile && (
              <div className="absolute top-2 left-2 z-10">
                <SidebarTrigger className="bg-background shadow-sm" />
              </div>
            )}
            <div className={isMobile ? "pt-8" : ""}>
              <DashboardHeader title="Tempo Dashboard" />
              
              <DashboardContent 
                urgentReminders={urgentReminders}
                upcomingReminders={upcomingReminders}
                completedReminders={completedReminders}
                onCompleteReminder={handleCompleteReminder}
                onUndoComplete={handleUndoComplete}
                onNewReminder={() => setShowQuickReminderModal(true)}
                onNewVoiceNote={() => setShowVoiceRecorderModal(true)}
                onUpdateReminder={handleReminderUpdated}
              />
              
              <DashboardModals 
                showQuickReminderModal={showQuickReminderModal}
                setShowQuickReminderModal={setShowQuickReminderModal}
                showVoiceRecorderModal={showVoiceRecorderModal}
                setShowVoiceRecorderModal={setShowVoiceRecorderModal}
                onReminderCreated={handleReminderCreated}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
