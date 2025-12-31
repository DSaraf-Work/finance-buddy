import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
        <div className="min-h-[calc(100vh-72px)] bg-background py-8 px-5">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h1 className="text-4xl font-bold text-foreground">Settings</h1>
              </div>
              <p className="mt-1 text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>

            <div className="space-y-6">
              {/* Account Information */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</dt>
                      <dd className="mt-1 text-foreground">{user?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Created</dt>
                      <dd className="mt-1 text-foreground">
                        {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Confirmed</dt>
                      <dd className="mt-1 text-foreground">
                        {user?.email_confirmed_at ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User ID</dt>
                      <dd className="mt-1 text-xs text-muted-foreground font-mono break-all">{user?.id}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Password Update */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="new-password" className="text-xs uppercase tracking-wide">
                        New Password
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password" className="text-xs uppercase tracking-wide">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        required
                        className="mt-1"
                      />
                    </div>
                    {passwordMessage && (
                      <div className={`text-sm p-3 rounded-xl border ${
                        passwordMessage.includes('successfully')
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-destructive/10 text-destructive border-destructive/30'
                      }`}>
                        {passwordMessage}
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full sm:w-auto shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Push Notifications */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Push Notifications
                  </CardTitle>
                  <CardDescription>
                    Get notified when new transactions are extracted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PushNotificationPrompt />
                </CardContent>
              </Card>

              {/* Connected Accounts */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Connected Gmail Accounts
                    </CardTitle>
                    <Button
                      onClick={handleConnect}
                      size="sm"
                      className="shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    >
                      Connect Account
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <LoadingScreen message="Loading..." fullScreen={false} size="sm" />
                  ) : connections.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <span className="text-3xl">📧</span>
                      </div>
                      <p className="text-muted-foreground mb-4">No Gmail accounts connected</p>
                      <Button
                        onClick={handleConnect}
                        className="shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      >
                        Connect Your First Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {connections.map((connection) => (
                        <div key={connection.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50 hover:border-primary/50 hover:bg-card/20 transition-all duration-200 gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                                <span className="text-lg">📧</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{connection.email_address}</p>
                                <p className="text-xs text-muted-foreground">
                                  Connected: {formatDate(connection.created_at)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Last sync: {formatDate(connection.last_sync_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              Connected
                            </Badge>
                            <Button
                              onClick={() => handleDisconnect(connection.id)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={preferences.emailNotifications}
                          onCheckedChange={(checked) =>
                            setPreferences(prev => ({ ...prev, emailNotifications: checked as boolean }))
                          }
                        />
                        <span className="text-sm text-foreground">Email notifications</span>
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground ml-6">
                        Receive email notifications for sync status and errors
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="sync-frequency" className="text-xs uppercase tracking-wide">
                        Sync Frequency
                      </Label>
                      <Select
                        value={preferences.syncFrequency}
                        onValueChange={(value) => setPreferences(prev => ({ ...prev, syncFrequency: value }))}
                      >
                        <SelectTrigger id="sync-frequency" className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual only</SelectItem>
                          <SelectItem value="hourly">Every hour</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="data-retention" className="text-xs uppercase tracking-wide">
                        Data Retention
                      </Label>
                      <Select
                        value={preferences.dataRetention}
                        onValueChange={(value) => setPreferences(prev => ({ ...prev, dataRetention: value }))}
                      >
                        <SelectTrigger id="data-retention" className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3months">3 months</SelectItem>
                          <SelectItem value="6months">6 months</SelectItem>
                          <SelectItem value="1year">1 year</SelectItem>
                          <SelectItem value="2years">2 years</SelectItem>
                          <SelectItem value="forever">Forever</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="export-format" className="text-xs uppercase tracking-wide">
                        Export Format
                      </Label>
                      <Select
                        value={preferences.exportFormat}
                        onValueChange={(value) => setPreferences(prev => ({ ...prev, exportFormat: value }))}
                      >
                        <SelectTrigger id="export-format" className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => alert('Preferences saved! (This is a demo - actual saving would be implemented)')}
                      className="w-full sm:w-auto shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    >
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SettingsPage;