
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker, setupPeriodicUpdateChecks } from './pwa-registration';

// Initialize the app
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

// Register service worker and then render app
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker()
    .then(() => {
      console.log('Service worker registration complete');
      setupPeriodicUpdateChecks(30); // Check for updates every 30 minutes
    })
    .catch(console.error);
}

// Render the app
renderApp();
