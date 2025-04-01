
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Mail } from "lucide-react";

const AccountSettings = () => {
  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("test@email.com");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveAccount = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Account updated",
        description: "Your account information has been saved",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base">Display Name</Label>
        <div className="flex">
          <div className="bg-muted flex items-center justify-center px-3 border-y border-l border-input rounded-l-md">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-l-none"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">Email Address</Label>
        <div className="flex">
          <div className="bg-muted flex items-center justify-center px-3 border-y border-l border-input rounded-l-md">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-l-none"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">Change Password</Label>
        <div className="flex">
          <div className="bg-muted flex items-center justify-center px-3 border-y border-l border-input rounded-l-md">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="rounded-l-none"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Password must be at least 8 characters long
        </p>
      </div>
      
      <Button 
        className="w-full sm:w-auto" 
        onClick={handleSaveAccount}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Account Settings"}
      </Button>
    </div>
  );
};

export default AccountSettings;
