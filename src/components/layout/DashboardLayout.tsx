import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useFeature } from '@/contexts/FeatureFlagContext';
import OfflineIndicator from '@/components/ui/OfflineIndicator';

const DashboardLayout = () => {
  const offlineNotificationsEnabled = useFeature('OFFLINE_NOTIFICATIONS');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
        {offlineNotificationsEnabled && <OfflineIndicator />}
      </div>
    </div>
  );
};

export default DashboardLayout;
