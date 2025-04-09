
import React, { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { Info, Share, PlusSquare, Home, AlertTriangle } from "lucide-react";
import { browserDetection } from "@/utils/browserDetection";
import { iosPwaDetection } from "@/utils/iosPwaDetection";
import { recordTelemetryEvent } from "@/utils/iosPushTelemetry";
import { DeviceSpecificInstructions } from "./DeviceSpecificInstructions";
import useInstallProgress from "@/hooks/use-install-progress";

interface EnhancedIOSPWAInstallGuideProps {
  onDismiss: () => void;
  onComplete?: () => void;
}

const EnhancedIOSPWAInstallGuide: React.FC<EnhancedIOSPWAInstallGuideProps> = ({
  onDismiss,
  onComplete
}) => {
  const {
    currentStep,
    error,
    nextStep,
    previousStep,
    handleError
  } = useInstallProgress();

  useEffect(() => {
    recordTelemetryEvent({
      eventType: 'pwa-install',
      isPWA: false,
      timestamp: Date.now(),
      result: 'started',
      metadata: {
        iosVersion: browserDetection.getIOSVersion()?.toString()
      }
    });
  }, []);

  const installSteps = [
    {
      title: "Begin Installation",
      description: "Start the installation process",
      icon: <Share className="h-4 w-4" />
    },
    {
      title: "Add to Home",
      description: "Add the app to your home screen",
      icon: <PlusSquare className="h-4 w-4" />
    },
    {
      title: "Complete Setup",
      description: "Finish the installation",
      icon: <Home className="h-4 w-4" />
    }
  ];

  const handleComplete = () => {
    iosPwaDetection.markPwaInstalled();
    recordTelemetryEvent({
      eventType: 'pwa-install',
      isPWA: false,
      timestamp: Date.now(),
      result: 'success'
    });
    if (onComplete) {
      onComplete();
    }
    onDismiss();
  };

  if (!browserDetection.isIOSSafari() || browserDetection.isIOSPWA()) {
    return null;
  }

  if (!currentStep) {
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
              onClick={nextStep}
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

  return (
    <Card className="my-4 border-amber-300">
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
            activeStep={currentStep - 1}
            className="max-w-md mx-auto"
          />
          
          <DeviceSpecificInstructions currentStep={currentStep - 1} />

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Installation Error</AlertTitle>
              <AlertDescription>
                {error}
                <p className="mt-2 text-sm">
                  Try refreshing the page or check your internet connection.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
        <Button
          variant="outline"
          onClick={previousStep}
        >
          Back
        </Button>
        <Button
          onClick={currentStep >= installSteps.length ? handleComplete : nextStep}
        >
          {currentStep >= installSteps.length ? "Done" : "Next Step"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedIOSPWAInstallGuide;
