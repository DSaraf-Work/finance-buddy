// Notification Bell Component

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Removed polling - notifications will be triggered via other mechanisms
  // (e.g., WebSocket, Server-Sent Events, or manual refresh)
  // useEffect(() => {
  //   fetchUnreadCount();
  //   // Disable Notification auto fetch for now
  //   // const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
  //   // return () => clearInterval(interval);
  // }, []);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    // DISABLED: Notification API calls disabled
    return;
  };

  const fetchRecentNotifications = async () => {
    // DISABLED: Notification API calls disabled
    setLoading(false);
    return;
  };

  const markAsRead = async (id: string) => {
    // DISABLED: Notification API calls disabled
    return;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Icon - Dark Purple Theme */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-[#2d1b4e]/30 rounded-lg border border-transparent hover:border-[#2d1b4e] focus:outline-none focus:ring-2 focus:ring-[#6b4ce6] focus:ring-offset-2 focus:ring-offset-[#1a1625] transition-all duration-200"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[#ec4899] rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content - Dark Purple Theme */}
          <div className="absolute right-0 z-20 mt-3 w-80 sm:w-96 bg-[#1a1625] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[#2d1b4e] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#2d1b4e] bg-[#0f0a1a]/50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#f8fafc]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={async () => {
                      // DISABLED: Notification API calls disabled
                      // await fetch('/api/notifications/mark-all-read', {
                      //   method: 'PATCH',
                      // });
                      setUnreadCount(0);
                      fetchRecentNotifications();
                    }}
                    className="text-xs font-medium text-[#a78bfa] hover:text-[#6b4ce6] transition-colors duration-200"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-[#94a3b8]">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b4ce6]"></div>
                  <p className="mt-2 text-sm">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-[#2d1b4e] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm text-[#94a3b8]">No notifications</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-[#2d1b4e] hover:bg-[#2d1b4e]/20 transition-colors duration-150 ${
                      !notification.read ? 'bg-[#6b4ce6]/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#f8fafc] truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-[#cbd5e1] mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 gap-2">
                          <span className="text-xs text-[#94a3b8]">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              onClick={() => {
                                markAsRead(notification.id);
                                setIsOpen(false);
                              }}
                              className="text-xs text-[#a78bfa] hover:text-[#6b4ce6] font-medium transition-colors duration-200"
                            >
                              {notification.action_label || 'View'}
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="ml-2 text-[#6b4ce6] hover:text-[#a78bfa] transition-colors duration-200"
                          aria-label="Mark as read"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#2d1b4e] bg-[#0f0a1a]/50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-[#a78bfa] hover:text-[#6b4ce6] font-medium transition-colors duration-200"
              >
                View all notifications →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

