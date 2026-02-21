import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';

export interface InAppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  transaction_id: string | null;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationContextValue {
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  dismissAll: () => Promise<void>;
  dismissForTransaction: (transactionId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch (err) {
      console.error('[NotificationContext] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const dismiss = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(err => console.error('[NotificationContext] dismiss error:', err));
  }, []);

  const dismissAll = useCallback(async () => {
    setNotifications([]);
    await fetch('/api/notifications', {
      method: 'DELETE',
      credentials: 'include',
    }).catch(err => console.error('[NotificationContext] dismissAll error:', err));
  }, []);

  const dismissForTransaction = useCallback(async (transactionId: string) => {
    // Optimistically remove from local state
    setNotifications(prev => prev.filter(n => n.transaction_id !== transactionId));
    // Delete server-side by transaction_id
    await fetch(`/api/notifications?transaction_id=${encodeURIComponent(transactionId)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(err => console.error('[NotificationContext] dismissForTransaction error:', err));
  }, []);

  // Fetch on mount / user change
  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setNotifications([]);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling
  useEffect(() => {
    if (!user) return;
    pollTimerRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [user, refresh]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isLoading, refresh, dismiss, dismissAll, dismissForTransaction }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
}
