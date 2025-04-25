
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorRecoveryOptions {
  onRetry?: () => Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const { toast } = useToast();

  const handleError = useCallback(async (error: Error, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    if (retryCount < maxRetries && options.onRetry) {
      setIsRecovering(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await options.onRetry();
        setRetryCount(0); // Reset on success
        setIsRecovering(false);
        
        toast({
          title: "Recovery Successful",
          description: "Operation completed successfully after retry",
          variant: "default"
        });
        
        return true;
      } catch (retryError) {
        setRetryCount(prev => prev + 1);
        setIsRecovering(false);
        
        toast({
          title: "Recovery Failed",
          description: "Could not complete the operation. Please try again.",
          variant: "destructive"
        });
        
        return false;
      }
    }
    
    // No more retries available
    toast({
      title: "Error",
      description: "An error occurred and could not be recovered automatically.",
      variant: "destructive"
    });
    
    return false;
  }, [maxRetries, retryDelay, retryCount, options.onRetry, toast]);

  return {
    handleError,
    isRecovering,
    retryCount,
    resetRetryCount: () => setRetryCount(0)
  };
}
