import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';

const SettingsPage: NextPage = () => {
  const { user, updatePassword } = useAuth();
  const [connections, setConnections] = useState<GmailConnectionPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    syncFrequency: 'manual',
    dataRetention: '1year',
    exportFormat: 'csv',
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gmail/connections');
      if (response.ok) {
        const data: ConnectionsResponse = await response.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage('');

    try {
      const result = await updatePassword(passwordForm.newPassword);
      if (result.error) {
        setPasswordMessage(result.error.message || 'Failed to update password');
      } else {
        setPasswordMessage('Password updated successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      setPasswordMessage('An error occurred while updating password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this Gmail account?')) {
      return;
    }

    try {
      const response = await fetch('/api/gmail/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_id: connectionId,
          revoke: true,
        }),
      });

      if (response.ok) {
        await loadConnections();
      } else {
        alert('Failed to disconnect account');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect account');
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/gmail/connect';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <ProtectedRoute>
      <Layout
        title="Settings - Finance Buddy"
        description="Manage your account settings and preferences"
      >
        <div className="py-6 sm:py-8 lg:py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-airbnb-red rounded-airbnb-lg flex items-center justify-center shadow-airbnb-md min-h-[44px] min-w-[44px]">
                  <span className="text-xl sm:text-2xl">⚙️</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-airbnb-text-primary">Settings</h1>
              </div>
              <p className="mt-1 text-sm sm:text-base text-airbnb-text-secondary">
                Manage your account settings and preferences
              </p>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {/* Account Information */}
              <div className="bg-airbnb-white shadow-airbnb-md border border-airbnb-border-light rounded-airbnb-lg">
                <div className="px-4 sm:px-6 py-4 border-b border-airbnb-border-light">
                  <h3 className="text-base sm:text-lg font-semibold text-airbnb-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-airbnb-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Account Information
                  </h3>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-airbnb-text-secondary uppercase tracking-wide">Email Address</dt>
                      <dd className="mt-1 text-sm sm:text-base text-airbnb-text-primary break-all">{user?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-airbnb-text-secondary uppercase tracking-wide">Account Created</dt>
                      <dd className="mt-1 text-sm sm:text-base text-airbnb-text-primary">
                        {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-airbnb-text-secondary uppercase tracking-wide">Email Confirmed</dt>
                      <dd className="mt-1 text-sm sm:text-base text-airbnb-text-primary">
                        {user?.email_confirmed_at ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-airbnb-text-secondary uppercase tracking-wide">User ID</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-airbnb-text-secondary font-mono break-all">{user?.id}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Password Update */}
              <div className="bg-airbnb-white shadow-airbnb-md border border-airbnb-border-light rounded-airbnb-lg">
                <div className="px-4 sm:px-6 py-4 border-b border-airbnb-border-light">
                  <h3 className="text-base sm:text-lg font-semibold text-airbnb-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-airbnb-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password
                  </h3>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-airbnb-text-primary mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-airbnb-white border border-airbnb-border-light rounded-airbnb-md text-airbnb-text-primary placeholder-airbnb-text-tertiary focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:border-airbnb-red transition-all duration-200 min-h-[44px]"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-airbnb-text-primary mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-airbnb-white border border-airbnb-border-light rounded-airbnb-md text-airbnb-text-primary placeholder-airbnb-text-tertiary focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:border-airbnb-red transition-all duration-200 min-h-[44px]"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    {passwordMessage && (
                      <div className={`text-sm p-3 rounded-airbnb-md ${passwordMessage.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {passwordMessage}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full sm:w-auto px-6 py-3 bg-airbnb-red text-airbnb-white font-medium rounded-airbnb-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 transition-all duration-200 shadow-airbnb-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="bg-airbnb-white shadow-airbnb-md border border-airbnb-border-light rounded-airbnb-lg">
                <div className="px-4 sm:px-6 py-4 border-b border-airbnb-border-light">
                  <h3 className="text-base sm:text-lg font-semibold text-airbnb-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-airbnb-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Push Notifications
                  </h3>
                  <p className="mt-1 text-sm text-airbnb-text-secondary">
                    Get notified when new transactions are extracted
                  </p>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <PushNotificationPrompt />
                </div>
              </div>

              {/* Connected Accounts */}
              <div className="bg-airbnb-white shadow-airbnb-md border border-airbnb-border-light rounded-airbnb-lg">
                <div className="px-4 sm:px-6 py-4 border-b border-airbnb-border-light">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-base sm:text-lg font-semibold text-airbnb-text-primary flex items-center gap-2">
                      <svg className="w-5 h-5 text-airbnb-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Connected Gmail Accounts
                    </h3>
                    <button
                      onClick={handleConnect}
                      className="w-full sm:w-auto px-5 py-3 bg-airbnb-red text-airbnb-white font-medium rounded-airbnb-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 transition-all duration-200 shadow-airbnb-sm min-h-[44px]"
                    >
                      Connect Account
                    </button>
                  </div>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-airbnb-red mx-auto"></div>
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-airbnb-red rounded-airbnb-lg flex items-center justify-center mx-auto mb-4 shadow-airbnb-md min-h-[64px] min-w-[64px]">
                        <span className="text-3xl">📧</span>
                      </div>
                      <p className="text-airbnb-text-secondary mb-4">No Gmail accounts connected</p>
                      <button
                        onClick={handleConnect}
                        className="px-6 py-3 bg-airbnb-red text-airbnb-white font-medium rounded-airbnb-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 transition-all duration-200 shadow-airbnb-sm min-h-[44px]"
                      >
                        Connect Your First Account
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {connections.map((connection) => (
                        <div key={connection.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-airbnb-border-light rounded-airbnb-md bg-airbnb-gray-light hover:border-airbnb-red hover:bg-airbnb-gray-hover transition-all duration-200 gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-airbnb-red rounded-airbnb-md flex items-center justify-center shadow-airbnb-sm min-h-[40px] min-w-[40px]">
                                <span className="text-lg">📧</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-airbnb-text-primary break-all">{connection.email_address}</p>
                                <p className="text-xs text-airbnb-text-secondary">
                                  Connected: {formatDate(connection.created_at)}
                                </p>
                                <p className="text-xs text-airbnb-text-secondary">
                                  Last sync: {formatDate(connection.last_sync_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 min-h-[32px]">
                              Connected
                            </span>
                            <button
                              onClick={() => handleDisconnect(connection.id)}
                              className="px-4 py-2 text-sm text-airbnb-error hover:text-opacity-80 hover:bg-red-50 rounded-airbnb-md border border-transparent hover:border-red-200 transition-all duration-200 min-h-[44px]"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-airbnb-white shadow-airbnb-md border border-airbnb-border-light rounded-airbnb-lg">
                <div className="px-4 sm:px-6 py-4 border-b border-airbnb-border-light">
                  <h3 className="text-base sm:text-lg font-semibold text-airbnb-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-airbnb-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Preferences
                  </h3>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="rounded border-airbnb-border-light bg-airbnb-white text-airbnb-red focus:ring-airbnb-red focus:ring-2 w-5 h-5 cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-airbnb-text-primary">Email notifications</span>
                      </label>
                      <p className="mt-1 text-xs text-airbnb-text-secondary ml-7">Receive email notifications for sync status and errors</p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-airbnb-text-primary mb-2">
                        Sync Frequency
                      </label>
                      <select
                        value={preferences.syncFrequency}
                        onChange={(e) => setPreferences(prev => ({ ...prev, syncFrequency: e.target.value }))}
                        className="w-full px-4 py-3 bg-airbnb-white border border-airbnb-border-light rounded-airbnb-md text-airbnb-text-primary focus:ring-2 focus:ring-airbnb-red focus:border-airbnb-red transition-all duration-200 cursor-pointer min-h-[44px]"
                      >
                        <option value="manual">Manual only</option>
                        <option value="hourly">Every hour</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-airbnb-text-primary mb-2">
                        Data Retention
                      </label>
                      <select
                        value={preferences.dataRetention}
                        onChange={(e) => setPreferences(prev => ({ ...prev, dataRetention: e.target.value }))}
                        className="w-full px-4 py-3 bg-airbnb-white border border-airbnb-border-light rounded-airbnb-md text-airbnb-text-primary focus:ring-2 focus:ring-airbnb-red focus:border-airbnb-red transition-all duration-200 cursor-pointer min-h-[44px]"
                      >
                        <option value="3months">3 months</option>
                        <option value="6months">6 months</option>
                        <option value="1year">1 year</option>
                        <option value="2years">2 years</option>
                        <option value="forever">Forever</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-airbnb-text-primary mb-2">
                        Export Format
                      </label>
                      <select
                        value={preferences.exportFormat}
                        onChange={(e) => setPreferences(prev => ({ ...prev, exportFormat: e.target.value }))}
                        className="w-full px-4 py-3 bg-airbnb-white border border-airbnb-border-light rounded-airbnb-md text-airbnb-text-primary focus:ring-2 focus:ring-airbnb-red focus:border-airbnb-red transition-all duration-200 cursor-pointer min-h-[44px]"
                      >
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="xlsx">Excel (XLSX)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => alert('Preferences saved! (This is a demo - actual saving would be implemented)')}
                      className="w-full sm:w-auto px-6 py-3 bg-airbnb-red text-airbnb-white font-medium rounded-airbnb-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 transition-all duration-200 shadow-airbnb-sm min-h-[44px]"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SettingsPage;
