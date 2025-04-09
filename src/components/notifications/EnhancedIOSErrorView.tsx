
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CircleX } from 'lucide-react';
import { ClassifiedError, RecoveryAction } from '@/utils/iosErrorHandler';

interface EnhancedIOSErrorViewProps {
  classifiedError: ClassifiedError;
  onRetry: () => void;
}

/**
 * Enhanced error view for iOS permission flow
 * Shows user-friendly error message with recovery actions
 */
export const EnhancedIOSErrorView: React.FC<EnhancedIOSErrorViewProps> = ({
  classifiedError,
  onRetry
}) => {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <CircleX className="h-4 w-4" />
        <AlertTitle>Unable to Enable Notifications</AlertTitle>
        <AlertDescription>
          {classifiedError.userMessage}
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Suggested actions:</p>
        
        {classifiedError.recoveryActions.map((action, index) => (
          <div key={index} className="flex flex-col space-y-1">
            <Button 
              onClick={() => action.action()}
              variant={index === 0 ? "default" : "outline"}
              className="w-full justify-start"
            >
              {action.label}
            </Button>
            <p className="text-xs text-muted-foreground pl-2">{action.description}</p>
          </div>
        ))}
        
        <div className="pt-2 border-t border-gray-100 mt-2">
          <Button 
            onClick={onRetry}
            variant="secondary" 
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
      
      {classifiedError.technicalDetails && (
        <details className="text-xs text-muted-foreground mt-4">
          <summary className="cursor-pointer">Technical details</summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
            {classifiedError.technicalDetails}
          </pre>
        </details>
      )}
    </div>
  );
};

export default EnhancedIOSErrorView;
