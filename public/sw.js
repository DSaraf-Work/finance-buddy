// Service Worker for Finance Buddy PWA
const CACHE_NAME = 'finance-buddy-v1';
const RUNTIME_CACHE = 'finance-buddy-runtime-v1';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/emails',
  '/transactions',
  '/manifest.json',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests - always fetch fresh
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - API unavailable' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // For navigation requests, use network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page if available
            return caches.match('/');
          });
        })
    );
    return;
  }

  // For other requests (CSS, JS, images), use cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone and cache the response
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================================================
// PUSH NOTIFICATION HANDLERS
// ============================================================================

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let pushData = {
    title: 'Finance Buddy',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {
      url: '/',
    },
  };

  // Parse push payload
  if (event.data) {
    try {
      pushData = { ...pushData, ...event.data.json() };
      console.log('[SW] Parsed push data:', pushData);
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }

  // Extract URL from nested data object (server sends { data: { url, notificationId } })
  const notificationUrl = pushData.data?.url || pushData.url || '/';

  console.log('[SW] Notification URL:', notificationUrl);

  const options = {
    body: pushData.body,
    icon: pushData.icon,
    badge: pushData.badge,
    vibrate: [200, 100, 200],
    tag: 'finance-buddy-notification',
    requireInteraction: false,
    data: {
      url: notificationUrl,
      notificationId: pushData.data?.notificationId,
      dateOfArrival: Date.now(),
    },
    actions: notificationUrl ? [
      {
        action: 'open',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ] : [],
  };

  console.log('[SW] Showing notification with options:', {
    title: pushData.title,
    url: notificationUrl,
    hasActions: options.actions.length > 0,
  });

  event.waitUntil(
    self.registration.showNotification(pushData.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', {
    action: event.action,
    data: event.notification.data,
    title: event.notification.title,
  });

  event.notification.close();

  if (event.action === 'close') {
    console.log('[SW] Close action clicked, dismissing notification');
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[SW] Found', clientList.length, 'open windows');

        // Try to find an existing window with the app
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(urlToOpen, self.location.origin);

          // If we have a window open to our app, navigate it to the target URL
          if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
            console.log('[SW] Focusing existing window and navigating to:', urlToOpen);
            client.focus();
            return client.navigate(urlToOpen);
          }
        }

        // If no window is open, open a new one
        if (clients.openWindow) {
          console.log('[SW] Opening new window with URL:', urlToOpen);
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('[SW] Error handling notification click:', error);
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification);
  // Optional: Track notification dismissals
});
