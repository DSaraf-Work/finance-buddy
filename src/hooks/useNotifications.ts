import { useState, useEffect, useCallback } from 'react';
import { showBrowserNotification, requestNotificationPermission, registerServiceWorker } from '@/lib/push-notifications';

interface Notification {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  url: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata: any;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    const initNotifications = async () => {
      console.log('[useNotifications] Initializing notifications...');
      const permission = await requestNotificationPermission();
      console.log('[useNotifications] Permission status:', permission);
      setPermissionGranted(permission === 'granted');

      if (permission === 'granted') {
        console.log('[useNotifications] Registering service worker...');
        const registration = await registerServiceWorker();
        console.log('[useNotifications] Service worker registered:', !!registration);
      }
    };

    initNotifications();
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (limit = 10) => {
    try {
      const res = await fetch(`/api/notifications?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Check for new notifications
  const checkForNewNotifications = useCallback(async () => {
    console.log('[useNotifications] Checking for new notifications...');
    console.log('[useNotifications] Last checked:', lastChecked);
    console.log('[useNotifications] Permission granted:', permissionGranted);

    try {
      const res = await fetch(`/api/notifications?limit=10`);
      if (res.ok) {
        const data: Notification[] = await res.json();
        console.log('[useNotifications] Fetched notifications:', data.length);

        // Find new notifications since last check
        const newNotifications = data.filter(
          n => new Date(n.created_at) > lastChecked && !n.read
        );

        console.log('[useNotifications] New notifications found:', newNotifications.length);
        console.log('[useNotifications] New notifications:', newNotifications);

        if (newNotifications.length > 0) {
          if (!permissionGranted) {
            console.warn('[useNotifications] Permission not granted, cannot show push notifications');
          } else {
            console.log('[useNotifications] Showing browser push notifications...');
            // Show browser push notification for each new notification
            for (const notification of newNotifications) {
              console.log('[useNotifications] Showing push for:', notification.title);
              await showBrowserNotification(notification.title, {
                body: notification.subtitle || notification.body,
                tag: notification.id,
                data: {
                  url: notification.url,
                  notificationId: notification.id,
                },
                requireInteraction: true,
              });
            }
          }
        }

        setNotifications(data);
        setLastChecked(new Date());
        await fetchUnreadCount();
      } else {
        console.error('[useNotifications] Failed to fetch notifications:', res.status);
      }
    } catch (error) {
      console.error('[useNotifications] Error checking for new notifications:', error);
    }
  }, [lastChecked, permissionGranted, fetchUnreadCount]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [fetchUnreadCount]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(checkForNewNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, checkForNewNotifications]);

  return {
    notifications,
    unreadCount,
    permissionGranted,
    fetchNotifications,
    fetchUnreadCount,
    checkForNewNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

