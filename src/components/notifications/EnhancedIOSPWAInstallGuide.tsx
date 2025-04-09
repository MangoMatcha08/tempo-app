
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { Info, Share, PlusSquare, Home } from "lucide-react";
import { browserDetection } from "@/utils/browserDetection";
import { iosPwaDetection } from "@/utils/iosPwaDetection";
import { recordTelemetryEvent } from "@/utils/iosPushTelemetry";

interface EnhancedIOSPWAInstallGuideProps {
  onDismiss: () => void;
  onComplete?: () => void;
}

const EnhancedIOSPWAInstallGuide: React.FC<EnhancedIOSPWAInstallGuideProps> = ({ 
  onDismiss,
  onComplete
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Don't show if not iOS Safari or already in PWA mode
  if (!browserDetection.isIOSSafari() || browserDetection.isIOSPWA()) {
    return null;
  }
  
  const installSteps = [
    {
      title: "Tap Share",
      description: "Tap the Share button in Safari",
      icon: <Share className="h-4 w-4" />
    },
    {
      title: "Add to Home Screen",
      description: "Scroll down and tap 'Add to Home Screen'",
      icon: <PlusSquare className="h-4 w-4" />
    },
    {
      title: "Confirm Installation",
      description: "Tap 'Add' in the top right corner",
      icon: <PlusSquare className="h-4 w-4" />
    },
    {
      title: "Open from Home Screen",
      description: "Find and tap the new app icon on your home screen",
      icon: <Home className="h-4 w-4" />
    }
  ];
  
  const handleExpand = () => {
    setIsExpanded(true);
    recordTelemetryEvent({
      eventType: 'pwa-install',
      isPWA: false,
      timestamp: Date.now(),
      result: 'started',
      metadata: {
        action: 'guide-expanded'
      }
    });
  };
  
  const handleNextStep = () => {
    if (activeStep < installSteps.length - 1) {
      setActiveStep(activeStep + 1);
      recordTelemetryEvent({
        eventType: 'pwa-install',
        isPWA: false,
        timestamp: Date.now(),
        result: 'progress',
        metadata: {
          step: activeStep + 1,
          totalSteps: installSteps.length
        }
      });
    } else {
      // Mark as installed in localStorage
      iosPwaDetection.markPwaInstalled();
      
      // Record completion
      recordTelemetryEvent({
        eventType: 'pwa-install',
        isPWA: false,
        timestamp: Date.now(),
        result: 'success',
        metadata: {
          completed: true
        }
      });
      
      // Call completion handler if provided
      if (onComplete) {
        onComplete();
      }
      
      // Dismiss the guide
      onDismiss();
    }
  };
  
  if (!isExpanded) {
    // Compact version (initial state)
    return (
      <Alert className="my-4 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-500" />
        <AlertTitle className="text-amber-800 dark:text-amber-500">
          Install as App for Push Notifications
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400">
          <p>On iOS, push notifications require installing as an app on your home screen.</p>
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={handleExpand} 
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Show Me How
            </Button>
            <Button 
              onClick={onDismiss} 
              variant="outline" 
              className="border-amber-600 text-amber-600 hover:bg-amber-100"
            >
              Later
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Expanded step-by-step guide
  return (
    <Card className="my-4 border-amber-300 overflow-hidden">
      <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
        <CardTitle className="text-amber-800 dark:text-amber-500 flex items-center gap-2">
          <Info className="h-5 w-5" />
          Install as App
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        <div className="space-y-6">
          <Steps
            steps={installSteps}
            activeStep={activeStep}
            className="max-w-md mx-auto"
          />
          
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-md">
            <h4 className="font-medium text-amber-800 dark:text-amber-500 mb-2">
              {installSteps[activeStep].title}
            </h4>
            <p className="text-amber-700 dark:text-amber-400">
              {installSteps[activeStep].description}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
        <Button 
          variant="outline" 
          onClick={onDismiss}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleNextStep}
        >
          {activeStep < installSteps.length - 1 ? "Next Step" : "Done"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedIOSPWAInstallGuide;
