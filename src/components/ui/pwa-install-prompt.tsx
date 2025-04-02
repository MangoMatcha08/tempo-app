
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled = 
      window.matchMedia('(display-mode: standalone)').matches || 
      // @ts-ignore - Property 'standalone' exists on modern browsers but not in TS types
      window.navigator.standalone === true;
    
    setIsStandalone(isAppInstalled);
    
    // Save the install prompt event for later use
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt as it can't be used again
    setInstallPrompt(null);
  };
  
  // Don't show the prompt if app is already installed or no install prompt is available
  if (isStandalone || !installPrompt) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Install Tempo App</CardTitle>
          <CardDescription>
            Add to your home screen for offline access
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">
            Install this app to access your reminders and schedule even without internet.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setInstallPrompt(null)}
          >
            Maybe later
          </Button>
          <Button 
            onClick={handleInstallClick} 
            size="sm"
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            Install
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
