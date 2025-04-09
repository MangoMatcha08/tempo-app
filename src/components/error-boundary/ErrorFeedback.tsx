import React from 'react';
import { ErrorResponse, ErrorSeverity } from '@/hooks/useErrorHandler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface ErrorFeedbackProps {
  error: ErrorResponse;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

/**
 * Component for displaying standardized error feedback to users
 */
export const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({ 
  error, 
  onRetry,
  onDismiss,
  showDetails = false
}) => {
  // Select icon based on severity
  const renderIcon = () => {
    switch(error.severity) {
      case ErrorSeverity.HIGH:
      case ErrorSeverity.FATAL:
        return <XCircle className="h-5 w-5" />;
      case ErrorSeverity.MEDIUM:
        return <AlertTriangle className="h-5 w-5" />;
      case ErrorSeverity.LOW:
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };
  
  // Determine alert variant based on severity - ensuring only supported variants are used
  const getAlertVariant = () => {
    switch(error.severity) {
      case ErrorSeverity.HIGH:
      case ErrorSeverity.FATAL:
        return "destructive";
      case ErrorSeverity.MEDIUM:
      case ErrorSeverity.LOW:
      default:
        return "default";
    }
  };
  
  return (
    <Alert variant={getAlertVariant()} className="my-4">
      <div className="flex items-center gap-2">
        {renderIcon()}
        <AlertTitle className="text-base">{error.message}</AlertTitle>
      </div>
      
      <AlertDescription className="mt-2">
        <p className="text-sm mb-3">
          {error.recoverable 
            ? "This issue can be resolved. Please try the suggested action below."
            : "We're sorry for the inconvenience. Our team has been notified of this issue."}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {error.retry && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={error.retry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          )}
          
          {onRetry && error.retry === undefined && (
            <Button 
              variant="default"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Try Again
            </Button>
          )}
          
          {onDismiss && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
        
        {showDetails && error.technicalDetails && (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-muted-foreground">Technical details</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.technicalDetails}
            </pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorFeedback;
