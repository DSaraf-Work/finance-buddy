import { useState, useEffect } from 'react';
import SafariInstallGuide from './SafariInstallGuide';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      return isStandalone || isIOSStandalone;
    };

    const installed = checkInstalled();
    setIsInstalled(installed);
    
    console.log('🔍 [PWAInstallButton] Initial check:', {
      isInstalled: installed,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isIOSStandalone: (window.navigator as any).standalone,
      userAgent: navigator.userAgent
    });

    // Listen for beforeinstallprompt event (Chrome/Edge only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('📱 [PWAInstallButton] beforeinstallprompt event received!');
      console.log('✅ [PWAInstallButton] Programmatic install available');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('🎉 [PWAInstallButton] App installed successfully!');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Log if we're waiting for beforeinstallprompt
    console.log('👂 [PWAInstallButton] Listening for beforeinstallprompt event...');
    console.log('ℹ️ [PWAInstallButton] Note: Safari does not fire beforeinstallprompt');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (typeof window === 'undefined') return;
    
    const platform = getPlatform();
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                     /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    console.log('🔵 [PWAInstallButton] Install button clicked', {
      platform,
      isSafari,
      hasDeferredPrompt: !!deferredPrompt,
      userAgent: navigator.userAgent,
      standalone: (window.navigator as any).standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      hasWebShare: 'share' in navigator
    });

    // For Safari/iOS - try to use Web Share API to open share sheet
    if ((isSafari || platform === 'ios') && !deferredPrompt) {
      console.log('📱 [PWAInstallButton] Safari/iOS detected - attempting Web Share API');
      
      if ('share' in navigator) {
        try {
          console.log('🚀 [PWAInstallButton] Attempting to trigger Web Share API...');
          await navigator.share({
            title: 'Install Finance Buddy',
            text: 'Add Finance Buddy to your home screen',
            url: window.location.href
          });
          console.log('✅ [PWAInstallButton] Web Share API triggered successfully');
          console.log('ℹ️ [PWAInstallButton] User can now select "Add to Home Screen" from share menu');
          return;
        } catch (error: any) {
          // User cancelled or error occurred
          if (error.name === 'AbortError') {
            console.log('ℹ️ [PWAInstallButton] User cancelled share dialog');
            return;
          }
          console.error('❌ [PWAInstallButton] Web Share API error:', error);
          console.log('🔄 [PWAInstallButton] Falling back to install guide');
        }
      } else {
        console.log('⚠️ [PWAInstallButton] Web Share API not available');
      }
      
      // Fallback to guide
      console.log('📱 [PWAInstallButton] Showing install guide');
      console.log('ℹ️ [PWAInstallButton] Safari does not support programmatic PWA installation');
      console.log('ℹ️ [PWAInstallButton] User must manually use Share > Add to Home Screen');
      setShowInstallGuide(true);
      return;
    }

    // For browsers with beforeinstallprompt (Chrome/Edge)
    if (deferredPrompt) {
      try {
        console.log('🚀 [PWAInstallButton] Attempting to trigger install prompt...');
        await deferredPrompt.prompt();
        console.log('✅ [PWAInstallButton] Install prompt shown successfully');
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log('📊 [PWAInstallButton] User choice:', outcome);
        
        if (outcome === 'accepted') {
          console.log('✅ [PWAInstallButton] User accepted PWA install prompt');
        } else {
          console.log('❌ [PWAInstallButton] User dismissed PWA install prompt');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ [PWAInstallButton] Error showing install prompt:', error);
        console.error('📋 [PWAInstallButton] Error details:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
          name: (error as Error).name
        });
        // Fallback to guide if prompt fails
        console.log('🔄 [PWAInstallButton] Falling back to install guide');
        setShowInstallGuide(true);
      }
      return;
    }

    // Fallback for other browsers
    console.log('⚠️ [PWAInstallButton] No install method available - showing guide');
    setShowInstallGuide(true);
  };

  // Detect platform for install guide
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
        className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition-all duration-200 font-medium shadow-[var(--shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] min-h-[44px] text-xs sm:text-sm"
        aria-label="Install Finance Buddy as PWA"
        title="Install Finance Buddy app"
      >
        <svg 
          className="w-4 h-4 sm:w-5 sm:h-5" 
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
        <span className="hidden sm:inline">Install</span>
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
