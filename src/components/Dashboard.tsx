
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Tempo Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.displayName || user?.email}
          </span>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - 8/12 */}
        <div className="lg:col-span-8 space-y-6">
          <CurrentPeriodIndicator />
          <QuickActionsBar 
            onNewReminder={() => setShowQuickReminderModal(true)}
            onNewVoiceNote={() => setShowVoiceRecorderModal(true)}
          />
          <RemindersSection />
          <VoiceNotesSection />
        </div>
        
        {/* Right column - 4/12 */}
        <div className="lg:col-span-4 space-y-6">
          <ProgressVisualization />
          <AchievementBadges />
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
