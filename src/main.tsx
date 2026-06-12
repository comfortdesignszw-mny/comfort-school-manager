import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Suppress html2canvas oklch parsing error spam
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('oklch')) {
    return;
  }
  if (args[0] instanceof Error && args[0].message.includes('oklch')) {
    return;
  }
  originalConsoleError(...args);
};

// Register the service worker for full offline support
const updateSW = registerSW({
  onNeedRefresh() {
    // Optionally trigger a UI to refresh the app on new updates
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App is ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
