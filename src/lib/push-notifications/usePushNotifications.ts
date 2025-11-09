import { useState, useEffect, useCallback } from 'react';
import PushNotificationManager, { PushNotificationOptions } from './push-manager';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  subscribe: (vapidPublicKey: string) => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<boolean>;
  showNotification: (options: PushNotificationOptions) => Promise<void>;
  getSubscription: () => Promise<PushSubscription | null>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if push notifications are supported
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (!supported) {
          setError('Push notifications are not supported in this browser');
          setIsLoading(false);
          return;
        }

        // Initialize push manager
        const initialized = await PushNotificationManager.initialize();
        if (!initialized) {
          setError('Failed to initialize push notifications');
          setIsLoading(false);
          return;
        }

        // Get current permission status
        const currentPermission = PushNotificationManager.getPermissionStatus();
        setPermission(currentPermission);

        // Check if already subscribed
        const subscription = await PushNotificationManager.getSubscription();
        setIsSubscribed(!!subscription);

        setIsLoading(false);
      } catch (err) {
        console.error('[usePushNotifications] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const newPermission = await PushNotificationManager.requestPermission();
      setPermission(newPermission);

      if (newPermission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Permission request error:', err);
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (vapidPublicKey: string): Promise<PushSubscription | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check permission first
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return null;
        }
      }

      const subscription = await PushNotificationManager.subscribe(vapidPublicKey);
      setIsSubscribed(!!subscription);
      setIsLoading(false);
      return subscription;
    } catch (err) {
      console.error('[usePushNotifications] Subscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      setIsLoading(false);
      return null;
    }
  }, [permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await PushNotificationManager.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }

      setIsLoading(false);
      return success;
    } catch (err) {
      console.error('[usePushNotifications] Unsubscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Show a local notification
  const showNotification = useCallback(async (options: PushNotificationOptions): Promise<void> => {
    try {
      setError(null);

      // Check permission first
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          return;
        }
      }

      await PushNotificationManager.showLocalNotification(options);
    } catch (err) {
      console.error('[usePushNotifications] Show notification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to show notification');
    }
  }, [permission, requestPermission]);

  // Get current subscription
  const getSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    try {
      const subscription = await PushNotificationManager.getSubscription();
      setIsSubscribed(!!subscription);
      return subscription;
    } catch (err) {
      console.error('[usePushNotifications] Get subscription error:', err);
      return null;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    getSubscription
  };
}

