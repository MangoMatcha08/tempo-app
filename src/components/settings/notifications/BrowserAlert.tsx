
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const BrowserAlert = () => {
  // Check if we're running in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Check if the browser is supported
  const isModernBrowser = isBrowser && 'Notification' in window;
  const isMobile = isBrowser && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isBrowser || isModernBrowser) return null;
  
  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {isMobile ? (
          "Some mobile browsers have limited notification support. For the best experience, use our mobile app."
        ) : (
          "Your browser may not support all notification features. Consider upgrading to a modern browser."
        )}
      </AlertDescription>
    </Alert>
  );
};

export default BrowserAlert;
