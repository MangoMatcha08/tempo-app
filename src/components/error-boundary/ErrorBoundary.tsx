
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorSeverity } from '@/hooks/useErrorHandler';
import { performanceReporter } from '@/utils/performanceAnalytics';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  reportToTelemetry?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global error boundary component to catch and display render errors gracefully
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Report to telemetry if enabled
    if (this.props.reportToTelemetry !== false) {
      performanceReporter.reportInteraction('error_boundary_catch', {
        error: error.message,
        componentStack: errorInfo.componentStack,
        severity: ErrorSeverity.HIGH
      });
    }
    
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <Card className="mx-auto max-w-md shadow-lg border-red-200">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg">Something went wrong</CardTitle>
            </div>
            <CardDescription>
              We encountered an error while rendering this component
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              You can try reloading the page or resetting this component.
            </p>
            
            {this.state.error && (
              <div className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-24">
                <p className="font-mono">{this.state.error.toString()}</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2 bg-muted/10 border-t">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button 
              variant="default"
              onClick={this.handleReset}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Reset Component
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
