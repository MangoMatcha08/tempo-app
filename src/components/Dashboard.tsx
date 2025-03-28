
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { success, error } = await signOutUser();
    
    if (success) {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      // Redirect to the sign in page after successful sign out
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard content will go here */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome to Tempo</h2>
          <p className="text-gray-600">
            Your teaching productivity dashboard is being set up. More features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
