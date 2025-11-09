import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

export default function TestPushPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    title: 'Finance Buddy Notification',
    body: 'This is a test push notification!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'test-notification',
    url: '/',
    requireInteraction: false
  });

  const sendPushNotification = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          icon: formData.icon,
          badge: formData.badge,
          tag: formData.tag,
          url: formData.url,
          data: {
            timestamp: Date.now(),
            testData: 'This is custom data'
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setMessage({
        type: 'success',
        text: `✅ Notification sent successfully! Sent: ${data.sent}, Failed: ${data.failed}, Total: ${data.total}`
      });
    } catch (error) {
      console.error('Send notification error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTransactionNotification = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '💳 New Transaction Detected',
          body: 'A transaction of ₹1,250.00 was detected from HDFC Bank',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: 'transaction-notification',
          url: '/transactions',
          data: {
            type: 'transaction',
            transactionId: 'test-123',
            amount: 1250.00,
            merchant: 'HDFC Bank'
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setMessage({
        type: 'success',
        text: `✅ Transaction notification sent! Sent: ${data.sent}, Failed: ${data.failed}`
      });
    } catch (error) {
      console.error('Send notification error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '📧 New Financial Email',
          body: '3 new financial emails detected from your bank',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: 'email-notification',
          url: '/emails',
          data: {
            type: 'email',
            count: 3,
            sender: 'alerts@bank.com'
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setMessage({
        type: 'success',
        text: `✅ Email notification sent! Sent: ${data.sent}, Failed: ${data.failed}`
      });
    } catch (error) {
      console.error('Send notification error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send notification'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout title="Test Push Notifications - Finance Buddy">
        <div className="py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Test Push Notifications</h1>
              <p className="mt-1 text-sm text-gray-500">
                Send test push notifications via API
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              {/* Quick Test Buttons */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Tests</h3>
                <div className="space-y-3">
                  <button
                    onClick={sendTransactionNotification}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : '💳 Send Transaction Notification'}
                  </button>
                  <button
                    onClick={sendEmailNotification}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : '📧 Send Email Notification'}
                  </button>
                </div>
              </div>

              {/* Custom Notification Form */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Notification</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input-field"
                      placeholder="Notification title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Notification body text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL (where to navigate on click)
                    </label>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="input-field"
                      placeholder="/"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag (unique identifier)
                    </label>
                    <input
                      type="text"
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      className="input-field"
                      placeholder="notification-tag"
                    />
                  </div>
                  <button
                    onClick={sendPushNotification}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : '🔔 Send Custom Notification'}
                  </button>
                </div>
              </div>

              {/* API Documentation */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Documentation</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Endpoint</h4>
                    <code className="block bg-gray-100 p-3 rounded text-sm">
                      POST /api/push/send
                    </code>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Request Body</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "title": "Notification Title",
  "body": "Notification body text",
  "icon": "/icons/icon-192x192.png",
  "badge": "/icons/icon-96x96.png",
  "tag": "unique-tag",
  "url": "/target-page",
  "data": {
    "customField": "customValue"
  }
}`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Response</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1
}`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">cURL Example</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`curl -X POST http://localhost:3000/api/push/send \\
  -H "Content-Type: application/json" \\
  -H "Cookie: fbsession=YOUR_SESSION_COOKIE" \\
  -d '{
    "title": "Test Notification",
    "body": "This is a test",
    "url": "/"
  }'`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

