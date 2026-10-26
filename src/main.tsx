import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Register PWA service worker with autoUpdate in production
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD && !window.location.hostname.includes('ais-dev')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA ServiceWorker registration failed:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);

