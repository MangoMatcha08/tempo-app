
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
import OfflineNotification from "@/components/ui/offline-notification";
import PwaInstallPrompt from "@/components/ui/pwa-install-prompt";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FirestoreProvider>
          <ScheduleProvider>
            <NotificationProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/settings" element={<Settings />} />
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
    </QueryClientProvider>
  );
}

export default App;
