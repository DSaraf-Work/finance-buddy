import React, { memo } from 'react';

interface Connection {
  id: string;
  email_address: string;
  last_sync_at: string | null;
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
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '14px',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#6366F1',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '20px',
        fontFamily: 'Outfit, sans-serif',
      }}>
        Connected Accounts
      </div>

      {connections.length === 0 ? (
        /* Empty State */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 24px',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '24px' }}>🔗</span>
          </div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '16px',
            fontFamily: 'Outfit, sans-serif',
          }}>
            No accounts connected
          </div>
          <button
            onClick={onConnect}
            style={{
              padding: '10px 20px',
              background: '#6366F1',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#FAFAFA',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
              transition: 'opacity 0.2s ease-out',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Connect Account
          </button>
        </div>
      ) : (
        /* Account List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="connection-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366F1';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '16px' }}>📧</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#FAFAFA',
                    marginBottom: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    {connection.email_address}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    {connection.last_sync_at
                      ? `Synced ${new Date(connection.last_sync_at).toLocaleDateString('en-IN')}`
                      : 'Never synced'}
                  </div>
                </div>
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#22C55E',
                borderRadius: '50%',
                flexShrink: 0,
                animation: 'pulse 2s ease-in-out infinite',
              }}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});