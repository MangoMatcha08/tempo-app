
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ErrorBoundary from '@/components/error-boundary/ErrorBoundary';
import { useErrorHandler, ErrorSeverity } from '@/hooks/useErrorHandler';
import { errorTelemetry } from '@/utils/errorTelemetry';
import { toast } from '@/hooks/use-toast';

// Component that will throw an error when rendered
const BuggyComponent: React.FC = () => {
  throw new Error('This is a test error from the BuggyComponent!');
  return <div>This will never render</div>;
};

/**
 * Demo component for testing error handling system
 */
export const ErrorDemo: React.FC = () => {
  const [showBuggy, setShowBuggy] = useState(false);
  const { handleError } = useErrorHandler();
  
  // Simulate a Firebase error
  const simulateFirebaseError = () => {
    const firebaseError = {
      code: 'permission-denied',
      message: 'Missing or insufficient permissions'
    };
    
    handleError(firebaseError, { source: 'firebase' });
  };
  
  // Simulate a network error
  const simulateNetworkError = () => {
    const networkError = new Error('Failed to fetch data: network request failed');
    handleError(networkError, { source: 'data-fetching' });
  };
  
  // Simulate a fatal error
  const simulateFatalError = () => {
    const error = {
      message: 'Critical system error',
      severity: ErrorSeverity.FATAL
    };
    
    errorTelemetry.reportError({
      message: 'Critical system error occurred',
      severity: ErrorSeverity.FATAL,
      recoverable: false,
      technicalDetails: 'Test fatal error for demonstration purposes',
      source: 'error-demo',
      timestamp: Date.now()
    });
    
    toast({
      title: "Fatal Error",
      description: "A critical system error has been simulated",
      variant: "destructive"
    });
  };

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>Error Handling System Demo</CardTitle>
        <CardDescription>
          Test the various error handling capabilities
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <Button
            variant="outline"
            onClick={simulateFirebaseError}
          >
            Simulate Firebase Permission Error
          </Button>
          
          <Button
            variant="outline"
            onClick={simulateNetworkError}
          >
            Simulate Network Error
          </Button>
          
          <Button
            variant="outline"
            onClick={simulateFatalError}
          >
            Simulate Fatal Error
          </Button>
          
          <div className="border rounded p-4">
            <p className="text-sm mb-3">Error Boundary Test:</p>
            <ErrorBoundary>
              {showBuggy ? <BuggyComponent /> : <p className="text-sm text-muted-foreground">Click the button to render a component that will throw an error</p>}
            </ErrorBoundary>
            <Button
              variant="outline"
              size="sm" 
              onClick={() => setShowBuggy(!showBuggy)}
              className="mt-4"
            >
              {showBuggy ? 'Hide' : 'Show'} Error Component
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/20 text-xs text-muted-foreground">
        <p>Note: Errors are being reported to telemetry and shown as toast notifications</p>
      </CardFooter>
    </Card>
  );
};

export default ErrorDemo;
