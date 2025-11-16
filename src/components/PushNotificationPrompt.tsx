/**
 * Push Notification Prompt Component
 * 
 * UI component for requesting push notification permissions and managing subscriptions.
 * Shows different states based on browser support, permission status, and subscription status.
 */

import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationPrompt() {
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [loading, setLoading] = useState(false);

  // Don't show if browser doesn't support push notifications
  if (!isSupported) {
    return null;
  }

  // Show blocked state if permission denied
  if (permission === 'denied') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Push notifications are blocked. Please enable them in your browser settings.
        </p>
      </div>
    );
  }

  // Show subscribed state
  if (isSubscribed) {
    const handleTestNotification = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/push/send-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send test notification');
        }

        alert('✅ Test notification sent! Check your notifications.');
      } catch (error: any) {
        console.error('Failed to send test notification:', error);
        alert(`❌ Failed to send test notification: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-[#10b981]">
              Push notifications enabled
            </p>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await unsubscribe();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="text-sm text-green-700 hover:text-green-900 underline disabled:opacity-50"
          >
            Disable
          </button>
        </div>
        <button
          onClick={handleTestNotification}
          disabled={loading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending...' : '🔔 Send Test Notification'}
        </button>
      </div>
    );
  }

  // Show prompt to enable notifications
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔔</span>
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-1">
            Enable Push Notifications
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Get notified when new transactions are extracted from your emails.
          </p>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await subscribe();
              } catch (error) {
                console.error('Subscription failed:', error);
                alert('Failed to enable notifications. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="bg-[#6b4ce6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#8b5cf6] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
}

