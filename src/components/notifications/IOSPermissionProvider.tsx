
import React, { useState } from 'react';
import { IOSPermissionFlow } from './IOSPermissionFlow';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { browserDetection } from '@/utils/browserDetection';
import { iosPwaDetection } from '@/utils/iosPwaDetection';
import { checkIOSPushSupport } from '@/utils/iosPermissionUtils';

interface IOSPermissionProviderProps {
  children: React.ReactNode;
  showPromptAutomatically?: boolean;
}

/**
 * Provider component that handles iOS permission flow
 * Can be used to wrap components that need notification permissions
 */
export const IOSPermissionProvider: React.FC<IOSPermissionProviderProps> = ({
  children,
  showPromptAutomatically = false
}) => {
  const { permissionGranted, isSupported } = useNotificationPermission();
  const [showPermissionFlow, setShowPermissionFlow] = useState(showPromptAutomatically);
  
  // Only show for iOS
  const isIOS = browserDetection.isIOS();
  const isPWA = iosPwaDetection.isRunningAsPwa();
  const iosSupport = checkIOSPushSupport();
  
  // Don't show anything if permission is already granted
  if (permissionGranted) {
    return <>{children}</>;
  }
  
  // Don't show the flow for non-iOS devices
  if (!isIOS) {
    return <>{children}</>;
  }
  
  // If notifications aren't supported in this browser, just show children
  if (!isSupported) {
    return <>{children}</>;
  }
  
  // If not in PWA mode, don't show permission flow
  if (!isPWA) {
    return <>{children}</>;
  }
  
  if (showPermissionFlow) {
    return (
      <div className="space-y-4">
        <IOSPermissionFlow />
        <div className="pt-2">
          {children}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {iosSupport.supported && !permissionGranted && (
        <div className="mb-4">
          <button 
            onClick={() => setShowPermissionFlow(true)}
            className="text-sm text-primary hover:underline"
          >
            Enable push notifications
          </button>
        </div>
      )}
      {children}
    </div>
  );
};

export default IOSPermissionProvider;
