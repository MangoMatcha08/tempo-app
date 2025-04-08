
import { useState, useEffect, useCallback } from 'react';
import { 
  registerServiceWorker, 
  getServiceWorkerStatus, 
  toggleServiceWorkerImplementation 
} from '@/pwa-registration';
import { AppMessage } from '@/types/notifications/serviceWorkerTypes';

interface ServiceWorkerState {
  supported: boolean;
  registered: boolean;
  implementation: 'legacy' | 'enhanced' | 'none';
  loading: boolean;
  error: string | null;
}

/**
 * Hook for interacting with the service worker, including the new enhanced implementation
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    supported: false,
    registered: false,
    implementation: 'none',
    loading: true,
    error: null
  });

  // Check for service worker support and status
  const checkStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const status = await getServiceWorkerStatus();
      
      setState({
        supported: status.supported,
        registered: status.registered,
        implementation: status.implementation as 'legacy' | 'enhanced' | 'none',
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        supported: 'serviceWorker' in navigator,
        registered: false,
        implementation: 'none',
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, []);

  // Register service worker
  const register = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await registerServiceWorker();
      await checkStatus();
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
      return false;
    }
  }, [checkStatus]);

  // Toggle between legacy and enhanced implementation
  const toggleImplementation = useCallback(async (useEnhanced: boolean) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await toggleServiceWorkerImplementation(useEnhanced);
      setTimeout(checkStatus, 500); // Give SW time to process the change
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
      return false;
    }
  }, [checkStatus]);

  // Send message to service worker
  const sendMessage = useCallback((message: AppMessage): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
        console.error('No active service worker found');
        resolve(false);
        return;
      }

      // Create a message channel for response
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.success) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      // Send the message
      navigator.serviceWorker.controller.postMessage(
        message,
        [messageChannel.port2]
      );

      // Resolve after timeout in case we don't get a response
      setTimeout(() => resolve(false), 3000);
    });
  }, []);

  // Run initial check
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Add listener for messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        console.log('Message from service worker:', event.data);
        
        // Here we could handle different message types
        if (event.data.type === 'READY') {
          checkStatus();
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [checkStatus]);

  return {
    ...state,
    register,
    toggleImplementation,
    sendMessage,
    checkStatus
  };
}

export default useServiceWorker;
