import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Connection {
  id: string;
  email_address: string;
  last_sync_at?: string;
}

interface ConnectedAccountsProps {
  connections: Connection[];
  onConnect: () => void;
}

export const ConnectedAccounts = memo(function ConnectedAccounts({
  connections,
  onConnect
}: ConnectedAccountsProps) {
  return (
    <Card className="bg-card/50 border-border/50 p-6">
      {/* Header */}
      <div className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-5">
        Connected Accounts
      </div>

      {connections.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center py-12 px-6">
          <div className="w-14 h-14 bg-muted/30 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            No accounts connected
          </div>
          <Button
            onClick={onConnect}
            className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            Connect Account
          </Button>
        </div>
      ) : (
        /* Account List */
        <div className="flex flex-col gap-3">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-4 rounded-[10px] border border-border/50 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-primary/10 rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <span className="text-base">📧</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {connection.email_address}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70">
                    {connection.last_sync_at
                      ? `Synced ${new Date(connection.last_sync_at).toLocaleDateString('en-IN')}`
                      : 'Never synced'}
                  </div>
                </div>
              </div>
              <div className="w-2 h-2 bg-success rounded-full flex-shrink-0 animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});