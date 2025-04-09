
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { browserDetection } from '@/utils/browserDetection';
import { IOSPermissionFlow } from './IOSPermissionFlow';
import { AlertCircle, BellRing } from 'lucide-react';
import { iosPushLogger } from '@/utils/iosPushLogger';

interface InlinePermissionFlowProps {
  onGranted?: () => void;
  className?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

/**
 * A compact notification permission flow that adapts to different platforms
 */
export function InlinePermissionFlow({
  onGranted,
  className,
  label = "Enable Notifications",
  variant = 'default'
}: InlinePermissionFlowProps) {
  const { permissionGranted, requestPermission, isSupported } = useNotificationPermission();
  const isIOS = browserDetection.isIOS();
  const supportsIOSWebPush = browserDetection.supportsIOSWebPush();
  
  // If permissions already granted or not supported, don't show anything
  if (permissionGranted || !isSupported) {
    return null;
  }
  
  // For iOS 16.4+, use the two-step permission flow
  if (isIOS && supportsIOSWebPush) {
    return <IOSPermissionFlow variant="minimal" onComplete={granted => {
      if (granted && onGranted) onGranted();
    }} />;
  }
  
  // For non-iOS, show a simple button
  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission();
      
      if (result.granted && onGranted) {
        onGranted();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };
  
  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleRequestPermission}
    >
      <BellRing className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}

export default InlinePermissionFlow;
