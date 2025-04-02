
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, BellRing, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendTestNotification } from "@/services/notificationService";
import { useNotifications } from "@/contexts/NotificationContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TestNotifications = () => {
  const [email, setEmail] = useState("zhom08@gmail.com");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPushSending, setIsPushSending] = useState(false);
  const { toast } = useToast();
  const { permissionGranted, requestPermission, notificationSettings } = useNotifications();

  const handleTestEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    setIsEmailSending(true);
    
    try {
      // Call the test notification function
      await sendTestNotification(email);
      
      toast({
        title: "Test email sent",
        description: `A test email was sent to ${email}`,
        duration: 3000
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleTestPush = async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: "Permission denied",
          description: "You need to allow notifications to test this feature",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
    }
    
    setIsPushSending(true);
    
    try {
      // In a real app, this would trigger a server call to send a push notification
      // For demo purposes, we'll just simulate it with a toast
      setTimeout(() => {
        toast({
          title: "Test push notification",
          description: "This is a test push notification",
          className: "bottom-toast",
          duration: 3000
        });
      }, 1500);
      
      toast({
        title: "Test push notification sent",
        description: "Check your device for the notification",
        duration: 3000
      });
    } catch (error) {
      console.error("Error sending test push notification:", error);
      toast({
        title: "Error",
        description: "Failed to send test push notification",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsPushSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Test Email Notification</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleTestEmail} 
            disabled={isEmailSending || !notificationSettings.email.enabled}
          >
            <Mail className="mr-2 h-4 w-4" />
            {isEmailSending ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          This will send a test email notification to verify your email settings.
        </p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Test Push Notification</h3>
        <Button 
          onClick={handleTestPush} 
          disabled={isPushSending || !notificationSettings.push.enabled}
        >
          <BellRing className="mr-2 h-4 w-4" />
          {isPushSending ? "Sending..." : "Send Test Notification"}
        </Button>
        <p className="text-sm text-muted-foreground">
          This will send a test push notification to your current device.
        </p>
      </div>
      
      <Alert className="rounded-md bg-yellow-50 border border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-800" />
        <AlertTitle className="text-yellow-800">Note about notifications</AlertTitle>
        <AlertDescription className="text-yellow-700">
          <p>
            In this demo version, notifications are simulated and won't actually be sent. 
            In a production version, these would connect to actual notification services.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TestNotifications;
