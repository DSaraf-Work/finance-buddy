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
  console.log('[Push] Showing browser notification:', title);
  console.log('[Push] Options:', options);

  const permission = await requestNotificationPermission();
  console.log('[Push] Permission:', permission);

  if (permission !== 'granted') {
    console.warn('[Push] Notification permission not granted');
    return;
  }

  const registration = await registerServiceWorker();
  console.log('[Push] Service worker registration:', !!registration);

  if (!registration) {
    console.log('[Push] Using fallback browser notification');
    // Fallback to browser notification if service worker fails
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
      });

      notification.onclick = () => {
        console.log('[Push] Notification clicked (fallback)');
        if (options.data?.url) {
          window.open(options.data.url, '_blank');
        }
        notification.close();
      };

      console.log('[Push] Fallback notification shown');
    }
    return;
  }

  // Use service worker to show notification
  console.log('[Push] Showing notification via service worker');
  await registration.showNotification(title, {
    body: options.body,
    icon: options.icon || '/icon-192x192.png',
    badge: options.badge || '/badge-72x72.png',
    tag: options.tag,
    data: options.data,
    requireInteraction: options.requireInteraction !== false,
  } as NotificationOptions);
  console.log('[Push] Notification shown successfully');
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

