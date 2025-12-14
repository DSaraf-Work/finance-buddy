// Notifications Page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  const fetchNotifications = async () => {
    // DISABLED: Notification API calls disabled
    setLoading(false);
    return;
  };

  const markAsRead = async (id: string) => {
    // DISABLED: Notification API calls disabled
    return;
    // try {
    //   await fetch(`/api/notifications/${id}/mark-read`, {
    //     method: 'PATCH',
    //   });
    //   setNotifications(prev =>
    //     prev.map(n => (n.id === id ? { ...n, read: true } : n))
    //   );
    // } catch (error) {
    //   console.error('Failed to mark as read:', error);
    // }
  };

  const deleteNotification = async (id: string) => {
    // DISABLED: Notification API calls disabled
    return;
    // if (!confirm('Are you sure you want to delete this notification?')) {
    //   return;
    // }

    // try {
    //   await fetch(`/api/notifications/${id}`, {
    //     method: 'DELETE',
    //   });
    //   setNotifications(prev => prev.filter(n => n.id !== id));
    //   setTotal(prev => prev - 1);
    // } catch (error) {
    //   console.error('Failed to delete notification:', error);
    // }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f8fafc]">Notifications</h1>
          <p className="mt-2 text-[#cbd5e1]">
            Stay updated with your transaction alerts
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setFilter('all');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-[var(--radius-md)] font-medium ${
                filter === 'all'
                  ? 'bg-[#6b4ce6] text-white'
                  : 'bg-[#2d1b4e]/30 text-[#cbd5e1] hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilter('unread');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-[var(--radius-md)] font-medium ${
                filter === 'unread'
                  ? 'bg-[#6b4ce6] text-white'
                  : 'bg-[#2d1b4e]/30 text-[#cbd5e1] hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => {
                setFilter('read');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-[var(--radius-md)] font-medium ${
                filter === 'read'
                  ? 'bg-[#6b4ce6] text-white'
                  : 'bg-[#2d1b4e]/30 text-[#cbd5e1] hover:bg-gray-200'
              }`}
            >
              Read
            </button>
          </div>

          {/* Bulk Actions */}
          {filter === 'unread' && notifications.length > 0 && (
            <button
              onClick={async () => {
                // DISABLED: Notification API calls disabled
                // await fetch('/api/notifications/mark-all-read', {
                //   method: 'PATCH',
                // });
                fetchNotifications();
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-primary)]"></div>
            <p className="mt-2 text-[var(--color-text-secondary)]">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-[#0f0a1a]/50 rounded-[var(--radius-md)]">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <p className="mt-4 text-[#cbd5e1]">No notifications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-[#1a1625] rounded-[var(--radius-md)] shadow p-6 ${
                  !notification.read ? 'border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#f8fafc]">
                      {notification.title}
                    </h3>
                    <p className="mt-2 text-[#cbd5e1]">{notification.message}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      {formatDate(notification.created_at)}
                    </p>
                    {notification.action_url && (
                      <button
                        onClick={() => {
                          markAsRead(notification.id);
                          router.push(notification.action_url!);
                        }}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-[#6b4ce6] text-white rounded-[var(--radius-md)] hover:bg-[#8b5cf6] font-medium"
                      >
                        {notification.action_label || 'View'}
                      </button>
                    )}
                  </div>
                  <div className="ml-4 flex space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Mark as read"
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
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-[#ef4444]"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[#2d1b4e]/30 text-[#cbd5e1] rounded-[var(--radius-md)] hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-[#cbd5e1]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[#2d1b4e]/30 text-[#cbd5e1] rounded-[var(--radius-md)] hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

