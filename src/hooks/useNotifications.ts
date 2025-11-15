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

  // Fetch unread count - DISABLED
  const fetchUnreadCount = useCallback(async () => {
    // DISABLED: Notification API calls disabled
    // try {
    //   const res = await fetch('/api/notifications/unread-count');
    //   if (res.ok) {
    //     const data = await res.json();
    //     setUnreadCount(data.count);
    //   }
    // } catch (error) {
    //   console.error('Error fetching unread count:', error);
    // }
  }, []);

  // Fetch notifications - DISABLED
  const fetchNotifications = useCallback(async (limit = 10) => {
    // DISABLED: Notification API calls disabled
    // try {
    //   const res = await fetch(`/api/notifications?limit=${limit}`);
    //   if (res.ok) {
    //     const data = await res.json();
    //     setNotifications(data);
    //   }
    // } catch (error) {
    //   console.error('Error fetching notifications:', error);
    // }
  }, []);

  // Check for new notifications - DISABLED
  const checkForNewNotifications = useCallback(async () => {
    // DISABLED: Notification API calls disabled
    console.log('[useNotifications] Notification checking is disabled');
  }, []);

  // Mark notification as read - DISABLED
  const markAsRead = useCallback(async (id: string) => {
    // DISABLED: Notification API calls disabled
    console.log('[useNotifications] Mark as read is disabled');
  }, []);

  // Mark all as read - DISABLED
  const markAllAsRead = useCallback(async () => {
    // DISABLED: Notification API calls disabled
    console.log('[useNotifications] Mark all as read is disabled');
  }, []);

  // Delete notification - DISABLED
  const deleteNotification = useCallback(async (id: string) => {
    // DISABLED: Notification API calls disabled
    console.log('[useNotifications] Delete notification is disabled');
  }, []);

  // Removed polling - notifications will be triggered via other mechanisms
  // (e.g., WebSocket, Server-Sent Events, or manual refresh)
  // useEffect(() => {
  //   fetchUnreadCount();
  //   const interval = setInterval(checkForNewNotifications, 30000);
  //   return () => clearInterval(interval);
  // }, [fetchUnreadCount, checkForNewNotifications]);

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

