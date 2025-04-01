
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, BellRing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TestNotifications = () => {
  const [email, setEmail] = useState("zhom08@gmail.com");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPushSending, setIsPushSending] = useState(false);
  const { toast } = useToast();

  const handleTestEmail = async () => {
    setIsEmailSending(true);
    
    // Simulate API call to send a test email
    setTimeout(() => {
      toast({
        title: "Test email sent",
        description: `A test email was sent to ${email}`,
      });
      setIsEmailSending(false);
    }, 1500);
  };

  const handleTestPush = async () => {
    setIsPushSending(true);
    
    // Simulate API call to send a test push notification
    setTimeout(() => {
      toast({
        title: "Test push notification sent",
        description: "Check your device for the notification",
      });
      setIsPushSending(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Test Email Notification</h3>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleTestEmail} disabled={isEmailSending}>
            <Mail className="mr-2 h-4 w-4" />
            {isEmailSending ? "Sending..." : "Send Test"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          This will send a test email notification to verify your email settings.
        </p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Test Push Notification</h3>
        <Button onClick={handleTestPush} disabled={isPushSending}>
          <BellRing className="mr-2 h-4 w-4" />
          {isPushSending ? "Sending..." : "Send Test Notification"}
        </Button>
        <p className="text-sm text-muted-foreground">
          This will send a test push notification to your current device.
        </p>
      </div>
      
      <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Note about notifications</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                In this demo version, notifications are simulated and won't actually be sent. 
                In a production version, these would connect to actual notification services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotifications;
