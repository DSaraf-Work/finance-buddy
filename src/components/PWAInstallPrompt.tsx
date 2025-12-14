import { useState, useEffect } from 'react';
import SafariInstallGuide from './SafariInstallGuide';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    // Check if app is already installed
    const checkInstalled = () => {
      // Check for standalone mode (PWA installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // iOS Safari specific check
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      return isStandalone || isIOSStandalone;
    };

    const installed = checkInstalled();
    setIsInstalled(installed);

    // Detect browser type
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|FxiOS|Edg/i.test(userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const isDesktopChrome = /Chrome/i.test(userAgent) && !/Mobile/i.test(userAgent);
    const isDesktopEdge = /Edg/i.test(userAgent) && !/Mobile/i.test(userAgent);

    // Check if user has dismissed this before (persist across sessions)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate 
      ? Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Show prompt logic
    const shouldShowPrompt = () => {
      // Don't show if already installed
      if (installed) {
        console.log('📱 [PWAInstallPrompt] App already installed, not showing prompt');
        return false;
      }

      // Don't show if dismissed in last 7 days
      if (dismissed && daysSinceDismissed !== null && daysSinceDismissed < 7) {
        console.log('📱 [PWAInstallPrompt] Prompt dismissed recently, not showing');
        return false;
      }

      // Show on mobile devices (iOS Safari, Android Chrome, etc.)
      if (isMobile) {
        return true;
      }

      // Show on desktop Chrome/Edge (supports beforeinstallprompt)
      if (isDesktopChrome || isDesktopEdge) {
        return true;
      }

      // Show on Safari (desktop or mobile) - Safari doesn't fire beforeinstallprompt
      if (isSafari) {
        return true;
      }

      return false;
    };

    // Listen for beforeinstallprompt event (Chrome/Edge only)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      
      console.log('📱 [PWAInstallPrompt] beforeinstallprompt event received');
      
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt if conditions are met
      if (shouldShowPrompt()) {
        console.log('📱 [PWAInstallPrompt] Conditions met (Chrome/Edge), will show prompt in 2 seconds');
        setTimeout(() => {
          console.log('📱 [PWAInstallPrompt] Showing install prompt');
          setShowPrompt(true);
        }, 2000);
      }
    };

    // For Safari (which doesn't fire beforeinstallprompt), show prompt directly
    if (isSafari && shouldShowPrompt()) {
      console.log('📱 [PWAInstallPrompt] Safari detected, will show prompt in 2 seconds');
      setTimeout(() => {
        console.log('📱 [PWAInstallPrompt] Showing install prompt (Safari)');
        setShowPrompt(true);
      }, 2000);
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      // Clear dismissal flag since app is now installed
      localStorage.removeItem('pwa-install-dismissed');
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
      // Show interactive install guide modal for all browsers without beforeinstallprompt
      setShowInstallGuide(true);
      setShowPrompt(false);
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
      setShowPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal with timestamp (persist across sessions)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if prompt not ready
  // For Safari, we show even without deferredPrompt (Safari doesn't support beforeinstallprompt)
  const isSafari = typeof window !== 'undefined' && 
    /Safari/i.test(navigator.userAgent) && 
    !/Chrome|CriOS|FxiOS|Edg/i.test(navigator.userAgent);
  if (!showPrompt || (!deferredPrompt && !isSafari)) {
    return null;
  }

  // Don't show if dismissed in this session
  if (sessionStorage.getItem('pwa-install-prompt-dismissed')) {
    return null;
  }

  // Detect platform for install guide
  const getPlatform = (): 'ios' | 'android' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    return 'desktop';
  };

  return (
    <>
      {/* Install Prompt Banner */}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-slide-up">
          <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] border border-[var(--color-border)] p-4 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[var(--color-accent-primary)]/20 rounded-[var(--radius-md)] flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 text-[var(--color-accent-primary)]" 
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
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                  Install Finance Buddy
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Install Finance Buddy on your phone for quick access and a better experience.
                </p>
                
                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition-all duration-200 font-medium shadow-[var(--shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] min-h-[44px]"
                    aria-label="Install Finance Buddy app"
                  >
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] rounded-[var(--radius-md)] min-h-[44px]"
                    aria-label="Dismiss install prompt"
                  >
                    Not now
                  </button>
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] rounded-[var(--radius-sm)] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close install prompt"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Install Guide Modal */}
      <SafariInstallGuide
        isOpen={showInstallGuide}
        onClose={() => {
          setShowInstallGuide(false);
          handleDismiss();
        }}
        platform={getPlatform()}
      />
    </>
  );
}
