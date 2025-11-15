// Push Notification Utilities

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function showBrowserNotification(
  title: string,
  options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
  } = {}
): Promise<void> {
  console.log('[Push] ========================================');
  console.log('[Push] Showing browser notification at:', new Date().toISOString());
  console.log('[Push] Title:', title);
  console.log('[Push] Options:', JSON.stringify(options, null, 2));

  const permission = await requestNotificationPermission();
  console.log('[Push] Permission status:', permission);

  if (permission !== 'granted') {
    console.warn('[Push] ❌ Notification permission not granted. Current:', permission);
    return;
  }

  console.log('[Push] ✅ Permission granted, proceeding with notification');

  const registration = await registerServiceWorker();
  console.log('[Push] Service worker registration exists:', !!registration);
  if (registration) {
    console.log('[Push] Service worker state:', registration.active?.state);
  }

  if (!registration) {
    console.log('[Push] ⚠️ Using fallback browser notification (no service worker)');
    // Fallback to browser notification if service worker fails
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          badge: options.badge || '/badge-72x72.png',
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction,
        });

        notification.onclick = () => {
          console.log('[Push] 🖱️ Notification clicked (fallback)');
          if (options.data?.url) {
            console.log('[Push] Navigating to:', options.data.url);
            window.open(options.data.url, '_blank');
          }
          notification.close();
        };

        notification.onshow = () => {
          console.log('[Push] ✅ Fallback notification shown to user');
        };

        notification.onerror = (error) => {
          console.error('[Push] ❌ Fallback notification error:', error);
        };

        console.log('[Push] ✅ Fallback notification created');
      } catch (error) {
        console.error('[Push] ❌ Error creating fallback notification:', error);
      }
    } else {
      console.error('[Push] ❌ Cannot show fallback notification - Notification API not available or permission denied');
    }
    console.log('[Push] ========================================');
    return;
  }

  // Use service worker to show notification
  try {
    console.log('[Push] 📢 Showing notification via service worker');
    await registration.showNotification(title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/badge-72x72.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction !== false,
    } as NotificationOptions);
    console.log('[Push] ✅ Service worker notification shown successfully');
  } catch (error) {
    console.error('[Push] ❌ Error showing service worker notification:', error);
    console.error('[Push] Error details:', error instanceof Error ? error.message : 'Unknown error');
  }
  console.log('[Push] ========================================');
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

