import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardContent from "./DashboardContent";
import DashboardModals from "./DashboardModals";
import DashboardSidebar from "./DashboardSidebar";
import DeveloperPanel from "@/components/developer/DeveloperPanel";
import { UIEnhancedReminder } from "./DashboardContent";
import { ReminderStats } from "@/hooks/reminders/reminder-stats";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";

interface DashboardMainProps {
  reminders: UIEnhancedReminder[];
  loading: boolean;
  isRefreshing?: boolean;
  urgentReminders: UIEnhancedReminder[];
  upcomingReminders: UIEnhancedReminder[];
  completedReminders: UIEnhancedReminder[];
  reminderStats: ReminderStats;
  handleCompleteReminder: (id: string) => void;
  handleUndoComplete: (id: string) => void;
  addReminder: (reminder: any) => Promise<boolean>;
  updateReminder: (reminder: UIEnhancedReminder) => void;
  loadMoreReminders: () => void;
  refreshReminders: () => Promise<boolean>;
  hasMore: boolean;
  totalCount: number;
  hasError?: boolean;
  addToBatchComplete?: (id: string) => void;
  addToBatchUpdate?: (reminder: UIEnhancedReminder) => void;
  deleteReminder?: (id: string) => Promise<boolean>;
  batchDeleteReminders?: (ids: string[]) => Promise<boolean>;
  pendingReminders?: Map<string, boolean>;
}

const DashboardMain = ({
  reminders,
  loading,
  isRefreshing,
  urgentReminders,
  upcomingReminders,
  completedReminders,
  reminderStats,
  handleCompleteReminder,
  handleUndoComplete,
  addReminder,
  updateReminder,
  loadMoreReminders,
  refreshReminders,
  hasMore,
  totalCount,
  hasError = false,
  addToBatchComplete,
  addToBatchUpdate,
  deleteReminder,
  batchDeleteReminders,
  pendingReminders = new Map()
}: DashboardMainProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalState, setModalState] = useState({
    quickReminder: false,
    voiceReminder: false
  });
  const { user } = useAuth();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const openModal = (modalName: keyof typeof modalState) => {
    setModalState(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modalState) => {
    setModalState(prev => ({ ...prev, [modalName]: false }));
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader
            pageTitle="Dashboard"
            onAddReminder={() => openModal('quickReminder')}
          />
          
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden p-4 pb-0">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSidebar}
              className="mb-4"
            >
              <Menu className="h-4 w-4 mr-2" />
              Menu
            </Button>
          </div>

          {/* Scrollable Content */}
          <div 
            className={cn(
              "flex-1 overflow-y-auto px-4 pb-12 pt-0 lg:px-8",
              sidebarOpen ? "lg:ml-0" : "lg:ml-0"
            )}
          >
            <DashboardContent
              urgentReminders={urgentReminders}
              upcomingReminders={upcomingReminders}
              completedReminders={completedReminders}
              onCompleteReminder={handleCompleteReminder}
              onUndoComplete={handleUndoComplete}
              onNewReminder={() => openModal('quickReminder')}
              onNewVoiceNote={() => openModal('voiceReminder')}
              onUpdateReminder={updateReminder}
              onClearAllCompleted={batchDeleteReminders ? 
                () => batchDeleteReminders(completedReminders.map(r => r.id)) : 
                undefined
              }
              onClearCompleted={deleteReminder}
              isLoading={loading}
              hasError={!!hasError}
              hasMoreReminders={hasMore}
              totalCount={totalCount}
              loadedCount={reminders.length}
              onLoadMore={loadMoreReminders}
              isRefreshing={isRefreshing}
              pendingReminders={pendingReminders}
            />
          </div>
        </div>

        {/* Modals */}
        <DashboardModals
          showQuickReminderModal={modalState.quickReminder}
          setShowQuickReminderModal={(open: boolean) => setModalState(prev => ({ ...prev, quickReminder: open }))}
          showVoiceRecorderModal={modalState.voiceReminder}
          setShowVoiceRecorderModal={(open: boolean) => setModalState(prev => ({ ...prev, voiceReminder: open }))}
          onReminderCreated={addReminder}
        />

        {/* Developer Panel */}
        <DeveloperPanel />
      </div>
    </SidebarProvider>
  );
};

export default DashboardMain;
