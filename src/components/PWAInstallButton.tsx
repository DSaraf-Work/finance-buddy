import { useState, useEffect } from 'react';
import SafariInstallGuide from './SafariInstallGuide';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Button - Temporary button in header to trigger PWA installation
 * Works for Chrome/Edge (programmatic) and Safari (shows guide)
 */
export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      return isStandalone || isIOSStandalone;
    };

    const installed = checkInstalled();
    setIsInstalled(installed);

    // Listen for beforeinstallprompt event (Chrome/Edge only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('📱 [PWAInstallButton] beforeinstallprompt event received');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For Safari and browsers without beforeinstallprompt, show interactive guide
      const platform = getPlatform();
      setShowInstallGuide(true);
      return;
    }

    try {
      // Show the install prompt (Chrome/Edge)
      await deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted PWA install prompt');
      } else {
        console.log('❌ User dismissed PWA install prompt');
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
      // Fallback to guide if prompt fails
      setShowInstallGuide(true);
    }
  };

  const getPlatform = (): 'ios' | 'android' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    return 'desktop';
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstall}
        className="inline-flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] border border-transparent hover:border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] transition-all duration-200 min-h-[44px] min-w-[44px]"
        aria-label="Install Finance Buddy as PWA"
        title="Install Finance Buddy as PWA"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" 
          />
        </svg>
      </button>

      {/* Interactive Install Guide Modal */}
      <SafariInstallGuide
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        platform={getPlatform()}
      />
    </>
  );
}
