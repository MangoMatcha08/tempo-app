
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo, useCallback } from "react";

interface DashboardHeaderProps {
  title: string;
  stats?: {
    totalActive: number;
    totalCompleted: number;
    totalReminders: number;
    completionRate: number;
    urgentCount: number;
    upcomingCount: number;
  };
}

// Use React.memo to prevent re-renders when props haven't changed
const DashboardHeader = memo(({ title, stats }: DashboardHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Memoize event handlers to prevent recreating functions on each render
  const handleSignOut = useCallback(async () => {
    const { success, error } = await signOutUser();
    
    if (success) {
      navigate("/");
    } else {
      console.error("Sign out failed:", error?.message);
    }
  }, [navigate]);

  const navigateToSchedule = useCallback(() => {
    navigate("/schedule");
  }, [navigate]);

  // User display name with fallback
  const userDisplayName = user?.displayName || user?.email || "User";

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {stats && (
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>{stats.totalActive} active</span>
            <span>{stats.totalCompleted} completed</span>
            <span>{stats.completionRate}% completion rate</span>
          </div>
        )}
      </div>
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
          {userDisplayName}
        </span>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
});

// Set display name for better debugging in React DevTools
DashboardHeader.displayName = "DashboardHeader";

export default DashboardHeader;
