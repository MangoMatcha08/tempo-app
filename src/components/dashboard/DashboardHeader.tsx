
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, LogOut, RefreshCw } from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import EnhancedToasts from "@/components/notifications/EnhancedToasts";
import { signOutUser } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardHeaderProps {
  onAddReminder: () => void;
  pageTitle: string;
  stats?: any;
}

const DashboardHeader = ({ onAddReminder, pageTitle, stats }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, verifyConnection } = useAuth();
  
  // Verify authentication is valid on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const auth = getAuth();
        if (auth.currentUser) {
          // Force token refresh to ensure it's valid
          await auth.currentUser.getIdToken(true);
          console.log("Authentication token refreshed successfully");
        }
      } catch (error) {
        console.error("Error refreshing auth token:", error);
      }
    };
    
    verifyAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      const { success } = await signOutUser();
      if (success) {
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out.",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign Out Failed",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleRefreshAuth = async () => {
    try {
      const success = await verifyConnection();
      if (success) {
        const auth = getAuth();
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
        
        toast({
          title: "Authentication Refreshed",
          description: "Your authentication status has been refreshed successfully.",
        });
      } else {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh authentication. Please try signing in again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Auth refresh error:", error);
      toast({
        title: "Authentication Error",
        description: "An error occurred while refreshing your authentication.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="container flex h-16 items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter className="mr-2" />
          <Button variant="outline" size="icon" onClick={handleRefreshAuth} title="Refresh Authentication">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh Authentication</span>
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
          <Button onClick={onAddReminder}>
            <Plus className="mr-2 h-4 w-4" />
            Quick Reminder
          </Button>
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign Out</span>
          </Button>
        </div>
      </div>
      <EnhancedToasts />
    </header>
  );
};

export default DashboardHeader;
