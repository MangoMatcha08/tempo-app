
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const DashboardHeader = ({ title, stats }: DashboardHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
          {user?.displayName || user?.email}
        </span>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
