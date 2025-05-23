
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker, setupPeriodicUpdateChecks } from './pwa-registration';

// Initialize the app
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Register service worker and then render app
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker()
    .then(() => {
      console.log('Service worker registration complete');
      setupPeriodicUpdateChecks(30); // Check for updates every 30 minutes
    })
    .catch(error => {
      console.error('Service worker registration failed:', error);
      console.warn('App will run without offline support');
    });
}

// Render the app regardless of service worker status
renderApp();
