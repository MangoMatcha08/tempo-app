
import { useState, useCallback } from 'react';
import { browserDetection } from '@/utils/browserDetection';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';

export function usePermissionFlow() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestPermission, permissionGranted } = useNotificationPermission();

  const startPermissionRequest = useCallback(async () => {
    try {
      setIsRequesting(true);
      setError(null);
      const result = await requestPermission();
      
      if (!result.granted) {
        setError(result.reason || 'Permission denied');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
    } finally {
      setIsRequesting(false);
    }
  }, [requestPermission]);

  return {
    isRequesting,
    error,
    permissionGranted,
    startPermissionRequest,
    isIOS: browserDetection.isIOS(),
    iosVersion: browserDetection.getIOSVersion()
  };
}
