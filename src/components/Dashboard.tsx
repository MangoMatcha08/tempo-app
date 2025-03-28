
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import CurrentPeriodIndicator from "@/components/dashboard/CurrentPeriodIndicator";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import RemindersSection from "@/components/dashboard/RemindersSection";
import ProgressVisualization from "@/components/dashboard/ProgressVisualization";
import VoiceNotesSection from "@/components/dashboard/VoiceNotesSection";
import AchievementBadges from "@/components/dashboard/AchievementBadges";
import QuickReminderModal from "@/components/dashboard/QuickReminderModal";
import VoiceRecorderModal from "@/components/dashboard/VoiceRecorderModal";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);

  const handleSignOut = async () => {
    const { success, error } = await signOutUser();
    
    if (success) {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate("/");
    } else {
      toast({
        title: "Sign out failed",
        description: error?.message || "An error occurred while signing out.",
        variant: "destructive",
      });
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
          <RemindersSection />
          <ProgressVisualization />
        </div>
        
        {/* Secondary content - 1/3 width on desktop */}
        <div>
          <VoiceNotesSection />
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
