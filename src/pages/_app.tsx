import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Head from 'next/head';
import { AuthProvider } from '@/contexts/AuthContext';
import { MockAIProvider } from '@/contexts/MockAIContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for PWA (disabled in development to prevent reload issues)
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🔄 New service worker available. Refresh to update.');
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });
      };

      // Register immediately if page is already loaded, otherwise wait for load event
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    } else if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
      // Unregister any existing service workers in development
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
      </Head>
      <AuthProvider>
        <NotificationProvider>
          <MockAIProvider>
            <Component {...pageProps} />
          </MockAIProvider>
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}
