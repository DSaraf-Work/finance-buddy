/**
 * Push Notification Manager for Finance Buddy PWA
 * Handles Web Push API integration with service worker
 */

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  url?: string;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.error('[Push] Service Worker not supported');
      return false;
    }

    if (!('PushManager' in window)) {
      console.error('[Push] Push API not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker ready');
      return true;
    } catch (error) {
      console.error('[Push] Failed to get service worker registration:', error);
      return false;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.error('[Push] Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Permission status:', permission);
    return permission;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   * @param vapidPublicKey - VAPID public key from server
   */
  async subscribe(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('[Push] Service Worker not registered');
      return null;
    }

    try {
      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();

      if (this.subscription) {
        console.log('[Push] Already subscribed');
        return this.subscription;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any // Type assertion to fix TypeScript error
      });

      console.log('[Push] Subscribed successfully');
      return this.subscription;
    } catch (error) {
      console.error('[Push] Failed to subscribe:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.log('[Push] No active subscription');
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('[Push] Unsubscribed successfully');
      return true;
    } catch (error) {
      console.error('[Push] Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('[Push] Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Show a local notification (doesn't require push subscription)
   */
  async showLocalNotification(options: PushNotificationOptions): Promise<void> {
    if (!this.registration) {
      console.error('[Push] Service Worker not registered');
      return;
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      console.error('[Push] Notification permission not granted');
      return;
    }

    try {
      // Build notification options with type assertion to avoid TypeScript errors
      // Some properties like 'vibrate', 'actions', 'timestamp' are not in all TypeScript definitions
      const notificationOptions: any = {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/icon-96x96.png',
        tag: options.tag || 'finance-buddy-local',
        requireInteraction: options.requireInteraction || false,
        data: { ...options.data, url: options.url || '/' },
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      };

      // Add actions if provided
      if (options.actions && options.actions.length > 0) {
        notificationOptions.actions = options.actions;
      }

      await this.registration.showNotification(options.title, notificationOptions);
      console.log('[Push] Local notification shown');
    } catch (error) {
      console.error('[Push] Failed to show notification:', error);
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default PushNotificationManager.getInstance();

