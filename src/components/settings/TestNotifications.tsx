
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, BellRing, AlertTriangle, Loader2, Info, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useNotificationSettings,
  useNotificationPermission,
  useNotificationServices
} from "@/hooks/notifications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getAuth } from "firebase/auth";

const TestNotifications = () => {
  const [email, setEmail] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPushSending, setIsPushSending] = useState(false);
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { settings } = useNotificationSettings();
  const { permissionGranted, requestPermission } = useNotificationPermission();
  const { sendTestNotification } = useNotificationServices();
  const { user } = useAuth();

  // Check authentication state
  useEffect(() => {
    const auth = getAuth();
    const checkAuth = () => {
      const isAuthAvailable = !!auth.currentUser;
      setIsAuthenticated(isAuthAvailable);
      console.log("Authentication state:", isAuthAvailable ? "Authenticated" : "Not authenticated");
      if (isAuthAvailable) {
        console.log("Current user:", auth.currentUser?.uid);
      }
    };
    
    checkAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      console.log("Auth state changed:", user ? "Authenticated" : "Not authenticated");
    });
    
    return () => unsubscribe();
  }, []);

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
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "You need to be signed in to send test notifications",
        variant: "destructive",
        duration: 3000
      });
      setErrorDetails("Authentication error: Please make sure you're signed in before sending test notifications");
      return;
    }
    
    setIsEmailSending(true);
    setErrorDetails(null);
    
    try {
      console.log("Sending test email notification to:", email);
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
      
      // Extract more useful error information
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for authentication issues
        if (errorMessage.includes('auth') || errorMessage.includes('unauthenticated') || errorMessage.includes('Authentication')) {
          setErrorDetails("Authentication error: Please make sure you're signed in and try again.");
        }
        // Check for CORS issues
        else if (errorMessage.includes('CORS') || errorMessage.includes('network')) {
          setErrorDetails("Network error: There might be an issue connecting to the Firebase functions.");
        }
        // Check for Firebase errors
        else if (errorMessage.includes('Firebase')) {
          setErrorDetails("Firebase error: Make sure your Firebase project is correctly configured.");
        }
      }
      
      toast({
        title: "Error",
        description: `Failed to send test email: ${errorMessage}`,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleTestPush = async () => {
    if (!permissionGranted) {
      console.log("Requesting notification permission...");
      const granted = await requestPermission();
      console.log("Permission request result:", granted);
      
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
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "You need to be signed in to send test notifications",
        variant: "destructive",
        duration: 3000
      });
      setErrorDetails("Authentication error: Please make sure you're signed in before sending test notifications");
      return;
    }
    
    setIsPushSending(true);
    setErrorDetails(null);
    
    try {
      console.log("Sending test push notification");
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
      
      // Extract more useful error information
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for authentication issues
        if (errorMessage.includes('auth') || errorMessage.includes('unauthenticated') || errorMessage.includes('Authentication')) {
          setErrorDetails("Authentication error: Please make sure you're signed in and try again.");
        }
        // Check for CORS issues
        else if (errorMessage.includes('CORS') || errorMessage.includes('network')) {
          setErrorDetails("Network error: There might be an issue connecting to the Firebase functions.");
        }
        // Check for Firebase errors
        else if (errorMessage.includes('Firebase')) {
          setErrorDetails("Firebase error: Make sure your Firebase project is correctly configured.");
        }
      }
      
      toast({
        title: "Error",
        description: `Failed to send test push notification: ${errorMessage}`,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsPushSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isAuthenticated && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>You must be signed in to send test notifications. Please sign in and try again.</AlertDescription>
        </Alert>
      )}
      
      {isAuthenticated && (
        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900">
          <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-700 dark:text-green-300">Authenticated</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            You're successfully authenticated and can send test notifications.
          </AlertDescription>
        </Alert>
      )}
      
      {errorDetails && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription>{errorDetails}</AlertDescription>
        </Alert>
      )}
      
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
            disabled={isEmailSending || !settings.email.enabled || !email || !isAuthenticated}
            variant={settings.email.enabled && isAuthenticated ? "default" : "outline"}
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
            disabled={isPushSending || !settings.push.enabled || !isAuthenticated}
            variant={settings.push.enabled && isAuthenticated ? "default" : "outline"}
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
      
      <Alert className="rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-800 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-400">Troubleshooting</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-500">
          <p className="mb-2">
            If you're experiencing issues with notifications:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Check that you're properly authenticated (signed in)</li>
            <li>Try refreshing the page to renew your authentication token</li>
            <li>Ensure your Firebase project is correctly configured</li>
            <li>Verify that notification permissions are granted in your browser</li>
          </ul>
        </AlertDescription>
      </Alert>
      
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
