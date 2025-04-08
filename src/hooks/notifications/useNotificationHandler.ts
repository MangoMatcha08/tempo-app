
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFeature } from '@/contexts/FeatureFlagContext';
import { ToastActionElement } from '@/components/ui/toast';

type NotificationType = 'default' | 'success' | 'info' | 'warning' | 'error' | 'destructive';

interface NotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  duration?: number;
  action?: ToastActionElement;
  onClose?: () => void;
}

export function useNotificationHandler() {
  const { toast } = useToast();
  const enableExtendedLogging = Boolean(useFeature('VERBOSE_LOGGING'));
  
  const sendNotification = useCallback((options: NotificationOptions) => {
    const { title, body, type = 'default', duration = 5000, action, onClose } = options;
    
    if (enableExtendedLogging) {
      console.log(`[Notification] ${type.toUpperCase()}: ${title} - ${body}`);
    }
    
    // Map notification types to toast variants
    const variantMap: Record<NotificationType, any> = {
      default: 'default',
      success: 'default',
      info: 'default',
      warning: 'default',
      error: 'destructive',
      destructive: 'destructive'
    };
    
    // Send the toast notification
    toast({
      title,
      description: body,
      variant: variantMap[type],
      duration,
      action,
    });
    
    // Return a unique ID for the notification (not implemented here)
    return Date.now().toString();
  }, [toast, enableExtendedLogging]);
  
  return { sendNotification };
}
