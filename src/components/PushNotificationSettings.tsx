import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/push-notifications/usePushNotifications';

export default function PushNotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification
  } = usePushNotifications();

  const [vapidPublicKey, setVapidPublicKey] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch VAPID public key on mount
  useEffect(() => {
    const fetchVapidKey = async () => {
      try {
        const response = await fetch('/api/push/vapid-public-key');
        const data = await response.json();
        if (data.publicKey) {
          setVapidPublicKey(data.publicKey);
        }
      } catch (err) {
        console.error('Failed to fetch VAPID key:', err);
      }
    };

    fetchVapidKey();
  }, []);

  const handleEnableNotifications = async () => {
    try {
      setActionLoading(true);
      setMessage(null);

      // Request permission if not granted
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setMessage({ type: 'error', text: 'Notification permission denied' });
          setActionLoading(false);
          return;
        }
      }

      // Subscribe to push notifications
      const subscription = await subscribe(vapidPublicKey);
      if (!subscription) {
        setMessage({ type: 'error', text: 'Failed to subscribe to notifications' });
        setActionLoading(false);
        return;
      }

      // Save subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setMessage({ type: 'success', text: 'Push notifications enabled!' });
      setActionLoading(false);
    } catch (err) {
      console.error('Enable notifications error:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to enable notifications' 
      });
      setActionLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setActionLoading(true);
      setMessage(null);

      // Get current subscription
      const subscription = await navigator.serviceWorker.ready
        .then(reg => reg.pushManager.getSubscription());

      if (subscription) {
        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }

      // Unsubscribe locally
      await unsubscribe();

      setMessage({ type: 'success', text: 'Push notifications disabled' });
      setActionLoading(false);
    } catch (err) {
      console.error('Disable notifications error:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to disable notifications' 
      });
      setActionLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await showNotification({
        title: 'Test Notification',
        body: 'This is a test notification from Finance Buddy!',
        icon: '/icons/icon-192x192.png',
        tag: 'test-notification',
        url: '/'
      });
      setMessage({ type: 'success', text: 'Test notification sent!' });
    } catch (err) {
      console.error('Test notification error:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to send test notification' 
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          ⚠️ Push notifications are not supported in this browser
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>
      
      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Status:</span>
          {isSubscribed ? (
            <span className="text-green-600 text-sm">✅ Enabled</span>
          ) : (
            <span className="text-gray-600 text-sm">❌ Disabled</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Permission:</span>
          <span className={`text-sm ${
            permission === 'granted' ? 'text-green-600' : 
            permission === 'denied' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {permission}
          </span>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {!isSubscribed ? (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading || actionLoading || !vapidPublicKey}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? 'Enabling...' : 'Enable Push Notifications'}
          </button>
        ) : (
          <>
            <button
              onClick={handleTestNotification}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Send Test Notification
            </button>
            <button
              onClick={handleDisableNotifications}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? 'Disabling...' : 'Disable Push Notifications'}
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>💡 Push notifications will alert you about:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>New financial emails detected</li>
          <li>Transaction extraction completed</li>
          <li>Important account updates</li>
        </ul>
      </div>
    </div>
  );
}

