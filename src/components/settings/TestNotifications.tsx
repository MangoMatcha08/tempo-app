
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, BellRing, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useNotificationSettings,
  useNotificationPermission,
  useNotificationServices
} from "@/hooks/notifications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const TestNotifications = () => {
  const [email, setEmail] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPushSending, setIsPushSending] = useState(false);
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const { toast } = useToast();
  const { settings } = useNotificationSettings();
  const { permissionGranted, requestPermission } = useNotificationPermission();
  const { sendTestNotification } = useNotificationServices();

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
      // Call the Cloud Function for email test
      const result = await sendTestNotification({ 
        type: 'email',
        email,
        includeDeviceInfo
      });
      
      console.log("Test email result:", result);
      
      toast({
        title: "Test email sent",
        description: `A test email was sent to ${email}`,
        duration: 3000
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      // Call the Cloud Function for push test
      const result = await sendTestNotification({
        type: 'push',
        includeDeviceInfo
      });
      
      console.log("Test push notification result:", result);
      
      toast({
        title: "Test push notification sent",
        description: "Check your device for the notification",
        duration: 3000
      });
    } catch (error) {
      console.error("Error sending test push notification:", error);
      toast({
        title: "Error",
        description: `Failed to send test push notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
            disabled={isEmailSending || !settings.email.enabled || !email}
            variant={settings.email.enabled ? "default" : "outline"}
          >
            {isEmailSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          This will send a test email notification to verify your email settings.
        </p>
        
        {!settings.email.enabled && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Email notifications are currently disabled in your settings.
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Test Push Notification</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Button 
            onClick={handleTestPush} 
            disabled={isPushSending || !settings.push.enabled}
            variant={settings.push.enabled ? "default" : "outline"}
            className="w-full sm:w-auto"
          >
            {isPushSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <BellRing className="mr-2 h-4 w-4" />
                Send Test Notification
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          This will send a test push notification to your current device.
        </p>
        
        {!settings.push.enabled && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Push notifications are currently disabled in your settings.
          </p>
        )}
        
        {!permissionGranted && settings.push.enabled && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            You need to grant notification permissions in your browser first.
          </p>
        )}
      </div>
      
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor="include-device-info" className="text-sm font-medium">
            Include device information in test notifications
          </Label>
          <Switch
            id="include-device-info"
            checked={includeDeviceInfo}
            onCheckedChange={setIncludeDeviceInfo}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          When enabled, test notifications will include information about your current device.
        </p>
      </div>
      
      <Alert className="rounded-md bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
        <AlertTriangle className="h-4 w-4 text-yellow-800 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-400">Testing information</AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-500">
          <p className="mb-2">
            Push notifications require browser support and permissions. If you don't receive notifications:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Check that notifications are enabled in your browser settings</li>
            <li>Make sure you're using a compatible browser (Chrome, Firefox, Edge, Safari)</li>
            <li>If on mobile, notifications might be limited by your device settings</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TestNotifications;
