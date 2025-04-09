
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { PermissionFlowStep, getFlowState, shouldResumeFlow } from '@/utils/iosPermissionFlowState';
import { checkIOSPushSupport } from '@/utils/iosPermissionUtils';
import { iosPwaDetection } from '@/utils/iosPwaDetection';
import { browserDetection } from '@/utils/browserDetection';
import { Info, AlertTriangle, CheckCircle, CircleX, Loader2 } from 'lucide-react';

/**
 * iOS-specific permission flow component
 * Provides a guided experience for enabling push notifications on iOS
 */
export const IOSPermissionFlow: React.FC = () => {
  const { requestPermission, permissionGranted } = useNotificationPermission();
  const [flowStep, setFlowStep] = useState<PermissionFlowStep>(PermissionFlowStep.INITIAL);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Check iOS support
  const iosSupport = checkIOSPushSupport();
  const isIOSDevice = browserDetection.isIOS();
  const isPWA = iosPwaDetection.isRunningAsPwa();
  const shouldPromptInstall = !isPWA && isIOSDevice;
  
  // Check for a saved flow state on component mount
  useEffect(() => {
    if (permissionGranted) {
      setFlowStep(PermissionFlowStep.COMPLETE);
      return;
    }
    
    if (shouldResumeFlow()) {
      const { step } = getFlowState();
      setFlowStep(step);
    }
  }, [permissionGranted]);
  
  // Update progress based on flow step
  useEffect(() => {
    switch (flowStep) {
      case PermissionFlowStep.INITIAL:
        setProgress(0);
        break;
      case PermissionFlowStep.SERVICE_WORKER_REGISTERED:
        setProgress(25);
        break;
      case PermissionFlowStep.PERMISSION_REQUESTED:
        setProgress(50);
        break;
      case PermissionFlowStep.PERMISSION_GRANTED:
        setProgress(75);
        break;
      case PermissionFlowStep.TOKEN_REQUESTED:
        setProgress(90);
        break;
      case PermissionFlowStep.COMPLETE:
        setProgress(100);
        break;
      default:
        setProgress(0);
    }
  }, [flowStep]);
  
  // Start permission flow
  const startPermissionFlow = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Update flow step from saved state if available
      if (shouldResumeFlow()) {
        const { step } = getFlowState();
        setFlowStep(step);
      }
      
      // Request permission
      const result = await requestPermission();
      
      // Update UI based on result
      if (result.granted) {
        setFlowStep(PermissionFlowStep.COMPLETE);
      } else {
        setError(result.reason || 'Permission denied');
        setFlowStep(PermissionFlowStep.ERROR);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setFlowStep(PermissionFlowStep.ERROR);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // If not on iOS 16.4+ or not in PWA mode, show appropriate message
  if (isIOSDevice && !iosSupport.supported) {
    return (
      <Card className="p-6 space-y-4">
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Push Notifications Not Available</AlertTitle>
          <AlertDescription>
            {iosSupport.reason === 'Not running as PWA' ? (
              <>
                Push notifications on iOS require installing this app to your home screen first.
              </>
            ) : iosSupport.reason === 'iOS version too low' ? (
              <>
                Your iOS version ({iosSupport.currentVersion}) doesn't support web push notifications.
                iOS {iosSupport.minimumVersion}+ is required.
              </>
            ) : (
              iosSupport.reason
            )}
          </AlertDescription>
        </Alert>
        
        {shouldPromptInstall && (
          <Button 
            onClick={() => window.location.href = '/settings?showInstallGuide=true'}
            className="w-full"
          >
            Show Installation Guide
          </Button>
        )}
      </Card>
    );
  }
  
  // The main flow UI
  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Enable Push Notifications</h3>
        {flowStep === PermissionFlowStep.COMPLETE && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>
      
      {/* Progress indicator */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {Math.ceil(progress / 25)} of 4</span>
          <span>{progress}%</span>
        </div>
      </div>
      
      {/* Flow steps */}
      <div className="space-y-4 py-2">
        {flowStep === PermissionFlowStep.INITIAL && (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Important: Follow These Steps Carefully</AlertTitle>
              <AlertDescription>
                iOS requires a specific process to enable notifications:
                <ol className="mt-2 ml-5 list-decimal">
                  <li>First, tap "Enable Notifications" below</li>
                  <li>When prompted by iOS, tap "Allow"</li>
                  <li>Wait for confirmation (do not refresh the page)</li>
                </ol>
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={startPermissionFlow}
              disabled={isProcessing} 
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : "Enable Notifications"}
            </Button>
          </>
        )}
        
        {(flowStep === PermissionFlowStep.SERVICE_WORKER_REGISTERED || 
         flowStep === PermissionFlowStep.PERMISSION_REQUESTED) && (
          <div className="text-center p-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2">
              Preparing notification service...
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please wait, this may take a moment.
            </p>
          </div>
        )}
        
        {flowStep === PermissionFlowStep.PERMISSION_GRANTED && (
          <div className="text-center p-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2">
              Permission granted! Setting up notifications...
            </p>
          </div>
        )}
        
        {flowStep === PermissionFlowStep.TOKEN_REQUESTED && (
          <div className="text-center p-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2">
              Almost there! Registering your device...
            </p>
          </div>
        )}
        
        {flowStep === PermissionFlowStep.COMPLETE && (
          <div className="text-center p-4">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
            <p className="mt-2 font-medium">
              Push notifications have been enabled!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll now receive notifications from this app.
            </p>
          </div>
        )}
        
        {flowStep === PermissionFlowStep.ERROR && (
          <>
            <Alert variant="destructive">
              <CircleX className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {error || "There was an error enabling notifications."}
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={startPermissionFlow}
              disabled={isProcessing} 
              className="w-full"
            >
              Try Again
            </Button>
          </>
        )}
      </div>
      
      {/* Help text */}
      {!permissionGranted && flowStep !== PermissionFlowStep.ERROR && (
        <p className="text-xs text-muted-foreground">
          {flowStep === PermissionFlowStep.INITIAL ? (
            "Push notifications allow us to send you important updates even when you're not using the app."
          ) : (
            "Please don't refresh this page during the process."
          )}
        </p>
      )}
    </Card>
  );
};

export default IOSPermissionFlow;
