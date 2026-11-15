import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initPerf } from './lib/perf';
import { prunePersistent } from './services/http';

// Decide the device tier before the first render so heavy effects never mount on weak devices.
initPerf();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

window.addEventListener('load', () => {
  // Housekeeping off the critical path.
  setTimeout(() => void prunePersistent(), 5000);

  // Offline support + image caching (production only; never interferes with Vite HMR).
  if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }

  // Allow another one-shot "stale chunk" reload only after the app has been
  // healthy for a while — prevents any chance of a reload loop.
  setTimeout(() => {
    try {
      sessionStorage.removeItem('wl:chunk-reload');
    } catch {
      /* ignore */
    }
  }, 15000);
});
