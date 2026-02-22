import { memo, useState, useRef, useEffect } from 'react';
import { Bell, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useNotificationContext, InAppNotification } from '@/contexts/NotificationContext';

function formatTimeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function NotificationItem({
  notification,
  onDismiss,
  onClick,
}: {
  notification: InAppNotification;
  onDismiss: (id: string) => void;
  onClick: (n: InAppNotification) => void;
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 cursor-pointer group hover:bg-foreground/[0.04] transition-colors duration-100"
      onClick={() => onClick(notification)}
    >
      {/* Unread dot */}
      {!notification.read && (
        <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
      )}

      <div className={`flex-1 min-w-0 ${notification.read ? 'pl-3' : ''}`}>
        <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
          {notification.title}
        </p>
        <p className="text-[12px] text-foreground/50 mt-0.5 leading-tight">
          {notification.body}
        </p>
        <p className="text-[10px] text-foreground/25 mt-1.5 font-medium">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>

      {/* Dismiss button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
        className="mt-0.5 shrink-0 p-1 rounded-lg text-foreground/20 hover:text-foreground/60 hover:bg-foreground/[0.06] opacity-0 group-hover:opacity-100 transition-all duration-150"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default memo(function NotificationBell() {
  const { notifications, unreadCount, dismiss, dismissAll } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  const handleNotificationClick = (notification: InAppNotification) => {
    if (notification.url) {
      router.push(notification.url);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell trigger */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 text-[9px] font-bold leading-none text-white bg-primary rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-card border border-border shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-[13px] font-semibold text-foreground">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={dismissAll}
                className="flex items-center gap-1.5 text-[11px] text-foreground/35 hover:text-destructive transition-colors duration-150"
                aria-label="Clear all notifications"
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="h-8 w-8 text-foreground/10" />
                <p className="text-[13px] text-foreground/25">No notifications</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onDismiss={dismiss}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});
