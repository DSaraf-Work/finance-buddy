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
    <div className="min-h-screen bg-airbnb-gray-light">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-airbnb-text-primary">Notifications</h1>
          <p className="mt-2 text-sm sm:text-base text-airbnb-text-secondary">
            Stay updated with your transaction alerts
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setFilter('all');
                setPage(1);
              }}
              className={`px-4 py-3 rounded-airbnb-md font-medium min-h-[44px] transition-colors ${
                filter === 'all'
                  ? 'bg-airbnb-red text-airbnb-white'
                  : 'bg-airbnb-white border border-airbnb-border-light text-airbnb-text-primary hover:bg-airbnb-gray-hover'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilter('unread');
                setPage(1);
              }}
              className={`px-4 py-3 rounded-airbnb-md font-medium min-h-[44px] transition-colors ${
                filter === 'unread'
                  ? 'bg-airbnb-red text-airbnb-white'
                  : 'bg-airbnb-white border border-airbnb-border-light text-airbnb-text-primary hover:bg-airbnb-gray-hover'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => {
                setFilter('read');
                setPage(1);
              }}
              className={`px-4 py-3 rounded-airbnb-md font-medium min-h-[44px] transition-colors ${
                filter === 'read'
                  ? 'bg-airbnb-red text-airbnb-white'
                  : 'bg-airbnb-white border border-airbnb-border-light text-airbnb-text-primary hover:bg-airbnb-gray-hover'
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
              className="text-sm text-airbnb-teal hover:text-airbnb-teal-dark font-medium min-h-[44px] px-4 py-2"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-airbnb-red"></div>
            <p className="mt-2 text-airbnb-text-secondary">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-airbnb-white rounded-airbnb-lg border border-airbnb-border-light">
            <svg
              className="mx-auto h-12 w-12 text-airbnb-text-tertiary"
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
            <p className="mt-4 text-airbnb-text-secondary">No notifications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-airbnb-white rounded-airbnb-lg shadow-airbnb-sm p-4 sm:p-6 border border-airbnb-border-light ${
                  !notification.read ? 'border-l-4 border-l-airbnb-red' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-airbnb-text-primary">
                      {notification.title}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-airbnb-text-secondary">{notification.message}</p>
                    <p className="mt-2 text-xs sm:text-sm text-airbnb-text-tertiary">
                      {formatDate(notification.created_at)}
                    </p>
                    {notification.action_url && (
                      <button
                        onClick={() => {
                          markAsRead(notification.id);
                          router.push(notification.action_url!);
                        }}
                        className="mt-4 inline-flex items-center px-4 py-2.5 bg-airbnb-red text-airbnb-white rounded-airbnb-md hover:bg-opacity-90 font-medium min-h-[44px] transition-colors"
                      >
                        {notification.action_label || 'View'}
                      </button>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-airbnb-teal hover:text-airbnb-teal-dark min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
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
                      className="text-airbnb-error hover:text-opacity-80 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
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
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 bg-airbnb-white border border-airbnb-border-light text-airbnb-text-primary rounded-airbnb-md hover:bg-airbnb-gray-hover disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
            >
              Previous
            </button>
            <span className="text-airbnb-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2.5 bg-airbnb-white border border-airbnb-border-light text-airbnb-text-primary rounded-airbnb-md hover:bg-airbnb-gray-hover disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

