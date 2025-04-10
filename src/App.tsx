
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import Dashboard from "@/components/Dashboard";
import Schedule from "@/pages/Schedule";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import { FirestoreProvider } from "@/contexts/FirestoreContext";
import { ScheduleProvider } from "@/contexts/ScheduleContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { FeatureFlagProvider } from "@/contexts/FeatureFlagContext";
import OfflineNotification from "@/components/ui/offline-notification";
import PwaInstallPrompt from "@/components/ui/pwa-install-prompt";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { ensureFirebaseInitialized } from "@/lib/firebase";
import ErrorBoundary from "@/components/error-boundary/ErrorBoundary";
import { errorTelemetry } from "@/utils/errorTelemetry";
import { ErrorSeverity } from "@/hooks/useErrorHandler";

// Ensure Firebase is initialized before React components
ensureFirebaseInitialized();

// Create QueryClient instance only once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

function App() {
  // Ensure we have a stable reference to queryClient
  const [queryClientInstance] = useState(() => queryClient);

  // Handle app-level errors caught by error boundary
  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to console for development
    console.error("App-level error caught:", error, errorInfo);
    
    // Report to telemetry
    errorTelemetry.reportError({
      message: "An unexpected error occurred in the application UI",
      severity: ErrorSeverity.HIGH,
      recoverable: false,
      technicalDetails: `${error.toString()}\n${errorInfo.componentStack}`,
      source: "app-root",
      timestamp: Date.now(),
    });
  };

  return (
    <React.StrictMode>
      <ErrorBoundary onError={handleAppError}>
        <QueryClientProvider client={queryClientInstance}>
          <FeatureFlagProvider>
            <AuthProvider>
              <FirestoreProvider>
                <ScheduleProvider>
                  <NotificationProvider>
                    <Router>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/dashboard" element={
                          <ErrorBoundary>
                            <Dashboard />
                          </ErrorBoundary>
                        } />
                        <Route path="/schedule" element={
                          <ErrorBoundary>
                            <Schedule />
                          </ErrorBoundary>
                        } />
                        <Route path="/settings" element={
                          <ErrorBoundary>
                            <Settings />
                          </ErrorBoundary>
                        } />
                        <Route path="/404" element={<NotFound />} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                      </Routes>
                      <Toaster />
                      <SonnerToaster position="top-right" closeButton />
                      <OfflineNotification />
                      <PwaInstallPrompt />
                    </Router>
                  </NotificationProvider>
                </ScheduleProvider>
              </FirestoreProvider>
            </AuthProvider>
          </FeatureFlagProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

export default App;
