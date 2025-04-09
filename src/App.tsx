
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OfflineSyncProvider } from '@/contexts/OfflineSyncContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import RemindersPage from '@/pages/RemindersPage';
import SettingsPage from '@/pages/SettingsPage';
import DeveloperPanel from '@/components/developer/DeveloperPanel';

function App() {
  return (
    <FeatureFlagProvider>
      <NotificationProvider>
        <OfflineSyncProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Auth Routes */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="reminders" replace />} />
                <Route path="reminders" element={<RemindersPage />} />
                <Route path="reminders/:id" element={<RemindersPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              
              {/* Developer Panel */}
              <Route path="/developer" element={<DeveloperPanel />} />
            </Routes>
            <Toaster />
          </Router>
        </OfflineSyncProvider>
      </NotificationProvider>
    </FeatureFlagProvider>
  );
}

export default App;
