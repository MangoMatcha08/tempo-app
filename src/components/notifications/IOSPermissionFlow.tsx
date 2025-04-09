
import React, { useState } from 'react';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';

interface IOSPermissionFlowProps {
  onComplete?: (granted: boolean) => void;
  variant?: 'default' | 'minimal';
  className?: string;
}

/**
 * iOS-specific permission flow component that implements the two-step
 * permission process for iOS push notifications.
 */
export function IOSPermissionFlow({ 
  onComplete, 
  variant = 'default',
  className
}: IOSPermissionFlowProps) {
  const { permissionGranted, requestPermission, isSupported } = useNotificationPermission();
  const [step, setStep] = useState<'initial' | 'priming' | 'requesting' | 'complete'>('initial');
  const [error, setError] = useState<string | null>(null);
  
  // Check if this is actually iOS
  const isIOS = browserDetection.isIOS();
  const iosVersion = browserDetection.getIOSVersion();
  const isPWA = browserDetection.isIOSPWA();
  const supportsWebPush = browserDetection.supportsIOSWebPush();
  
  // Debug information
  const debugInfo = {
    isIOS,
    iosVersion,
    isPWA,
    supportsWebPush,
    permissionGranted
  };
  
  // Handle the initial permission priming step
  const handlePrimePermission = () => {
    iosPushLogger.logPermissionEvent('ios-prime-clicked', debugInfo);
    setStep('priming');
    
    // Small delay to ensure user gesture context is maintained
    setTimeout(() => {
      setStep('requesting');
    }, 500);
  };
  
  // Handle the actual permission request (after priming)
  const handleRequestPermission = async () => {
    try {
      // Log that we're starting the iOS permission flow from a user gesture
      iosPushLogger.logPermissionEvent('ios-request-start', debugInfo);
      
      // Make the actual request - this should trigger the system prompt
      const result = await requestPermission();
      
      // Log the result
      iosPushLogger.logPermissionEvent(
        result.granted ? 'ios-request-granted' : 'ios-request-denied',
        { ...debugInfo, token: result.token ? `${result.token.substring(0, 5)}...` : null }
      );
      
      // Update UI state
      setStep('complete');
      
      // Notify parent component
      if (onComplete) {
        onComplete(result.granted);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setError(errorMsg);
      iosPushLogger.logPermissionEvent('ios-request-error', { 
        ...debugInfo, 
        error: errorMsg 
      });
      setStep('initial');
    }
  };
  
  // If not iOS or doesn't support web push, show appropriate message
  if (!isIOS) {
    return null;
  }
  
  if (!supportsWebPush) {
    return variant === 'minimal' ? null : (
      <Alert className="mb-4">
        <AlertDescription>
          Your iOS version ({iosVersion}) doesn't support web push notifications.
          iOS 16.4+ is required.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Already have permission
  if (permissionGranted) {
    return variant === 'minimal' ? null : (
      <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
        <AlertDescription>
          You've already enabled push notifications on this device.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Show appropriate UI based on current step
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Enable Notifications on iOS</CardTitle>
        <CardDescription>
          {isPWA 
            ? "Enable notifications to get updates even when the app is closed" 
            : "Install this app and enable notifications for the best experience"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {step === 'initial' && (
          <div className="space-y-4">
            <p>iOS requires a two-step process to enable notifications:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>First, tap the button below to begin</li>
              <li>Then, tap <strong>Allow</strong> when prompted by iOS</li>
            </ol>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {step === 'priming' && (
          <div className="text-center">
            <p>Preparing to request notifications...</p>
          </div>
        )}
        
        {step === 'requesting' && (
          <div className="space-y-4">
            <p className="font-medium">Ready to enable notifications?</p>
            <p>Tap the button below and then select <strong>Allow</strong> when prompted.</p>
          </div>
        )}
        
        {step === 'complete' && (
          <div>
            <p>Thank you! Your notification preference has been saved.</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {step === 'initial' && (
          <Button onClick={handlePrimePermission} variant="default">
            Enable Notifications
          </Button>
        )}
        
        {step === 'requesting' && (
          <Button onClick={handleRequestPermission} variant="default">
            Request Notifications
          </Button>
        )}
        
        {step === 'complete' && (
          <Button onClick={() => setStep('initial')} variant="outline">
            Done
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default IOSPermissionFlow;
