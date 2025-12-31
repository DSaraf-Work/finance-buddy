import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { GmailConnectionPublic, ConnectionsResponse } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { useMockAI } from '@/contexts/MockAIContext';
import KeywordManager from '@/components/KeywordManager';
import BankAccountTypesManager from '@/components/BankAccountTypesManager';
import CustomAccountTypesManager from '@/components/CustomAccountTypesManager';
import CategoriesManager from '@/components/CategoriesManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface SystemHealth {
  status: string;
  timestamp: string;
  environment: Record<string, boolean>;
  database: {
    connected: boolean;
    rls_active: boolean;
    tables: string[];
  };
  version: string;
}

const AdminPage: NextPage = () => {
  const { mockAIEnabled, toggleMockAI } = useMockAI();
  const [connections, setConnections] = useState<GmailConnectionPublic[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEmails: 0,
    totalTransactions: 0,
    lastSyncDate: null as string | null,
  });

  useEffect(() => {
    fetchConnections();
    fetchHealth();
    fetchStats();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/gmail/connections');
      if (response.ok) {
        const data: ConnectionsResponse = await response.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/test/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };

  const fetchStats = async () => {
    // This would normally call actual stats APIs
    // For now, showing placeholder data
    setStats({
      totalEmails: 0,
      totalTransactions: 0,
      lastSyncDate: null,
    });
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this Gmail account? This will revoke access tokens but preserve historical data.')) {
      return;
    }

    setLoading(true);
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
        await fetchConnections();
        alert('Gmail account disconnected successfully');
      } else {
        const error = await response.text();
        alert(`Failed to disconnect: ${error}`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect account');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/gmail/connect';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getConnectionStatus = (connection: GmailConnectionPublic) => {
    if (connection.last_error) {
      return { status: 'error', label: 'Error', color: 'destructive' as const };
    }
    if (connection.last_sync_at) {
      const daysSinceSync = Math.floor((Date.now() - new Date(connection.last_sync_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceSync > 7) {
        return { status: 'stale', label: 'Stale', color: 'secondary' as const };
      }
      return { status: 'active', label: 'Active', color: 'default' as const };
    }
    return { status: 'new', label: 'New', color: 'outline' as const };
  };

  return (
    <ProtectedRoute>
      <Layout
        title="Admin Dashboard - Finance Buddy"
        description="Admin dashboard for Finance Buddy"
      >
        <div className="min-h-[calc(100vh-72px)] bg-background py-8 px-5">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                    <span className="text-xl sm:text-2xl">⚙️</span>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage Gmail connections and monitor system health
                </p>
              </div>
              <Button
                onClick={handleConnect}
                className="shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Connect Gmail Account
              </Button>
            </div>

            {/* Mock AI Configuration */}
            <Card className="bg-card/50 border-border/50 mb-8">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      Mock AI Configuration
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {mockAIEnabled
                        ? 'Using pattern-based mock responses for development/testing'
                        : 'Using real AI models (OpenAI, Anthropic, Google)'
                      }
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={mockAIEnabled ? "secondary" : "default"}
                      className={cn(
                        "font-semibold",
                        mockAIEnabled
                          ? "bg-secondary/20 text-secondary-foreground border-secondary/30"
                          : "bg-primary/20 text-primary border-primary/30"
                      )}
                    >
                      {mockAIEnabled ? 'Mock AI' : 'Real AI'}
                    </Badge>
                    <Switch
                      checked={mockAIEnabled}
                      onCheckedChange={toggleMockAI}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </CardHeader>
              {mockAIEnabled && (
                <CardContent>
                  <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-secondary text-lg">⚠️</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Mock AI is enabled. Transaction extraction will use pattern-based logic instead of real AI models.
                          This saves API costs during development but may be less accurate than real AI.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      <span className="text-2xl">📧</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Total Emails
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stats.totalEmails}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Total Transactions
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stats.totalTransactions}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                      <span className="text-2xl">🔄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Last Sync
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1 truncate">
                        {stats.lastSyncDate ? formatDate(stats.lastSyncDate) : 'Never'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gmail Connections */}
            <Card className="bg-card/50 border-border/50 mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Gmail Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {connections.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                      <span className="text-3xl">📧</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Gmail accounts connected</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Connect your first Gmail account to start syncing financial emails
                    </p>
                    <Button
                      onClick={handleConnect}
                      className="shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Connect Gmail Account
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Account
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Status
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Last Sync
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Scopes
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Connected
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {connections.map((connection) => {
                          const status = getConnectionStatus(connection);

                          return (
                            <TableRow
                              key={connection.id}
                              className="border-border/50 hover:bg-muted/30"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                                    <span className="text-lg">📧</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-foreground">
                                      {connection.email_address}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {connection.id.substring(0, 8)}...
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={status.color}>
                                  {status.label}
                                </Badge>
                                {connection.last_error && (
                                  <div className="text-xs text-destructive mt-1" title={connection.last_error}>
                                    Error: {connection.last_error.substring(0, 50)}...
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(connection.last_sync_at)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                <div className="max-w-xs truncate" title={connection.granted_scopes.join(', ')}>
                                  {connection.granted_scopes.length} scopes
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(connection.created_at)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  onClick={() => handleDisconnect(connection.id)}
                                  disabled={loading}
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  Disconnect
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Account Types Management */}
            <BankAccountTypesManager className="mb-8" />

            {/* Custom Account Types Management */}
            <CustomAccountTypesManager className="mb-8" />

            {/* Transaction Categories Management */}
            <CategoriesManager className="mb-8" />

            {/* Transaction Keywords Management */}
            <KeywordManager className="mb-8" />

            {/* System Information */}
            {health && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                        Environment Variables
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(health.environment).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border border-border/50"
                          >
                            <span className="text-sm text-muted-foreground">{key}</span>
                            <Badge
                              variant={value ? "default" : "destructive"}
                              className={cn(
                                "text-xs font-semibold",
                                value
                                  ? "bg-primary/20 text-primary border-primary/30"
                                  : "bg-destructive/20 text-destructive border-destructive/30"
                              )}
                            >
                              {value ? 'Set' : 'Missing'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                        Database Status
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border border-border/50">
                          <span className="text-sm text-muted-foreground">Connection</span>
                          <Badge
                            variant={health.database.connected ? "default" : "destructive"}
                            className={cn(
                              "text-xs font-semibold",
                              health.database.connected
                                ? "bg-primary/20 text-primary border-primary/30"
                                : "bg-destructive/20 text-destructive border-destructive/30"
                            )}
                          >
                            {health.database.connected ? 'Connected' : 'Failed'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border border-border/50">
                          <span className="text-sm text-muted-foreground">RLS Active</span>
                          <Badge
                            variant={health.database.rls_active ? "default" : "secondary"}
                            className={cn(
                              "text-xs font-semibold",
                              health.database.rls_active
                                ? "bg-primary/20 text-primary border-primary/30"
                                : "bg-secondary/20 text-secondary-foreground border-secondary/30"
                            )}
                          >
                            {health.database.rls_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="mt-3 p-2 bg-muted/20 rounded-lg border border-border/50">
                          <span className="text-sm text-muted-foreground font-medium">Tables:</span>
                          <div className="text-xs text-muted-foreground/70 mt-1">
                            {health.database.tables.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-foreground">Version: </span>
                        <span className="text-sm text-muted-foreground">{health.version}</span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">Last Updated: </span>
                        <span className="text-sm text-muted-foreground">{formatDate(health.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AdminPage;