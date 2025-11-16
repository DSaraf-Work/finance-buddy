import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import { colorSchemes, ColorScheme } from '@/styles/design-tokens';

const SettingsPage: NextPage = () => {
  const { user, updatePassword } = useAuth();
  const { colorScheme, setColorScheme, availableSchemes } = useTheme();
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
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-primary to-brand-hover rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(107,76,230,0.3)]">
                  <span className="text-xl sm:text-2xl">⚙️</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary">Settings</h1>
              </div>
              <p className="mt-1 text-sm sm:text-base text-text-secondary">
                Manage your account settings and preferences
              </p>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {/* Account Information */}
              <div className="bg-bg-secondary shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border rounded-xl">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Account Information
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wide">Email Address</dt>
                      <dd className="mt-1 text-sm sm:text-base text-text-primary">{user?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wide">Account Created</dt>
                      <dd className="mt-1 text-sm sm:text-base text-text-primary">
                        {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wide">Email Confirmed</dt>
                      <dd className="mt-1 text-sm sm:text-base text-text-primary">
                        {user?.email_confirmed_at ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wide">User ID</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-text-secondary font-mono break-all">{user?.id}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Theme/Appearance Settings */}
              <div className="bg-bg-secondary shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border rounded-xl">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Appearance
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Customize the look and feel of Finance Buddy
                  </p>
                </div>
                <div className="px-6 py-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide">
                        Color Scheme
                      </label>
                      <p className="text-sm text-text-muted mb-4">
                        Choose a color scheme that suits your preference. Changes apply instantly.
                      </p>

                      {/* Theme Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {availableSchemes.map((scheme) => {
                          const schemeData = colorSchemes[scheme];
                          const isActive = colorScheme === scheme;

                          // Theme icons
                          const themeIcons: Record<ColorScheme, string> = {
                            darkPurple: '🌙',
                            darkBlue: '💼',
                            light: '☀️',
                            darkGreen: '🌿',
                            lightBlue: '☁️',
                            yellow: '⭐',
                            monotone: '⚫',
                            mattePurple: '💜',
                          };

                          return (
                            <button
                              key={scheme}
                              onClick={() => setColorScheme(scheme)}
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                isActive
                                  ? 'border-brand-primary bg-brand-primary/10 shadow-lg'
                                  : 'border-border hover:border-border-light bg-bg-elevated hover:bg-bg-hover'
                              }`}
                            >
                              {/* Active Indicator */}
                              {isActive && (
                                <div className="absolute top-2 right-2">
                                  <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}

                              {/* Theme Icon & Name */}
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{themeIcons[scheme]}</span>
                                <div>
                                  <div className={`text-sm font-semibold ${isActive ? 'text-brand-primary' : 'text-text-primary'}`}>
                                    {schemeData.name}
                                  </div>
                                  {isActive && (
                                    <div className="text-xs text-brand-primary font-medium">
                                      Active
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Color Preview */}
                              <div className="flex gap-1.5">
                                <div
                                  className="w-6 h-6 rounded border border-border"
                                  style={{ backgroundColor: schemeData.colors.bgPrimary }}
                                  title="Background"
                                />
                                <div
                                  className="w-6 h-6 rounded"
                                  style={{ backgroundColor: schemeData.colors.brandPrimary }}
                                  title="Primary"
                                />
                                <div
                                  className="w-6 h-6 rounded"
                                  style={{ backgroundColor: schemeData.colors.accentEmerald }}
                                  title="Accent"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Current Theme Info */}
                      <div className="mt-4 p-4 bg-bg-elevated rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">ℹ️</div>
                          <div>
                            <div className="text-sm font-medium text-text-primary mb-1">
                              Current Theme: {colorSchemes[colorScheme].name}
                            </div>
                            <div className="text-xs text-text-muted">
                              Your theme preference is automatically saved and will be applied across all pages.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Update */}
              <div className="bg-bg-secondary shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border rounded-xl">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 uppercase tracking-wide">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 uppercase tracking-wide">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    {passwordMessage && (
                      <div className={`text-sm p-3 rounded-lg ${passwordMessage.includes('successfully') ? 'bg-accent-emerald/10 text-accent-emerald border border-[#10b981]/30' : 'bg-error/10 text-error border border-[#ef4444]/30'}`}>
                        {passwordMessage}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg-secondary transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="bg-bg-secondary shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border rounded-xl">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Push Notifications
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Get notified when new transactions are extracted
                  </p>
                </div>
                <div className="px-6 py-4">
                  <PushNotificationPrompt />
                </div>
              </div>

              {/* Connected Accounts */}
              <div className="bg-bg-secondary shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border rounded-xl">
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Connected Gmail Accounts
                    </h3>
                    <button
                      onClick={handleConnect}
                      className="w-full sm:w-auto px-5 py-2.5 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg-secondary transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)]"
                    >
                      Connect Account
                    </button>
                  </div>
                </div>
                <div className="px-6 py-4">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b4ce6] mx-auto"></div>
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-hover rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(107,76,230,0.3)]">
                        <span className="text-3xl">📧</span>
                      </div>
                      <p className="text-text-secondary mb-4">No Gmail accounts connected</p>
                      <button
                        onClick={handleConnect}
                        className="px-6 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg-secondary transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)]"
                      >
                        Connect Your First Account
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {connections.map((connection) => (
                        <div key={connection.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-lg bg-bg-primary/50 hover:border-brand-primary hover:bg-bg-elevated/20 transition-all duration-200 gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-hover rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(107,76,230,0.3)]">
                                <span className="text-lg">📧</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-primary">{connection.email_address}</p>
                                <p className="text-xs text-text-muted">
                                  Connected: {formatDate(connection.created_at)}
                                </p>
                                <p className="text-xs text-text-muted">
                                  Last sync: {formatDate(connection.last_sync_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-accent-emerald/10 text-accent-emerald border border-[#10b981]/30">
                              Connected
                            </span>
                            <button
                              onClick={() => handleDisconnect(connection.id)}
                              className="px-3 py-1.5 text-sm text-error hover:text-[#dc2626] hover:bg-error/10 rounded-lg border border-transparent hover:border-[#ef4444] transition-all duration-200"
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
              <div className="bg-bg-secondary shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border rounded-xl">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#6b4ce6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Preferences
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="rounded border-border bg-bg-primary text-[#6b4ce6] focus:ring-brand-primary focus:ring-offset-bg-secondary w-4 h-4"
                        />
                        <span className="ml-2 text-sm text-text-primary">Email notifications</span>
                      </label>
                      <p className="mt-1 text-xs text-text-muted ml-6">Receive email notifications for sync status and errors</p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 uppercase tracking-wide">
                        Sync Frequency
                      </label>
                      <select
                        value={preferences.syncFrequency}
                        onChange={(e) => setPreferences(prev => ({ ...prev, syncFrequency: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200 cursor-pointer"
                      >
                        <option value="manual" className="bg-bg-secondary">Manual only</option>
                        <option value="hourly" className="bg-bg-secondary">Every hour</option>
                        <option value="daily" className="bg-bg-secondary">Daily</option>
                        <option value="weekly" className="bg-bg-secondary">Weekly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 uppercase tracking-wide">
                        Data Retention
                      </label>
                      <select
                        value={preferences.dataRetention}
                        onChange={(e) => setPreferences(prev => ({ ...prev, dataRetention: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200 cursor-pointer"
                      >
                        <option value="3months" className="bg-bg-secondary">3 months</option>
                        <option value="6months" className="bg-bg-secondary">6 months</option>
                        <option value="1year" className="bg-bg-secondary">1 year</option>
                        <option value="2years" className="bg-bg-secondary">2 years</option>
                        <option value="forever" className="bg-bg-secondary">Forever</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 uppercase tracking-wide">
                        Export Format
                      </label>
                      <select
                        value={preferences.exportFormat}
                        onChange={(e) => setPreferences(prev => ({ ...prev, exportFormat: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200 cursor-pointer"
                      >
                        <option value="csv" className="bg-bg-secondary">CSV</option>
                        <option value="json" className="bg-bg-secondary">JSON</option>
                        <option value="xlsx" className="bg-bg-secondary">Excel (XLSX)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => alert('Preferences saved! (This is a demo - actual saving would be implemented)')}
                      className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg-secondary transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)]"
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
