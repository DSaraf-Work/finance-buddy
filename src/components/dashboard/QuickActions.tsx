import React, { memo } from 'react';
import Link from 'next/link';

interface QuickAction {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  priorityResult?: any;
}

export const QuickActions = memo(function QuickActions({ actions, priorityResult }: QuickActionsProps) {
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
        Quick Actions
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {actions.map((action, index) => {
          const Component = action.href ? Link : 'button' as any;
          const props = action.href ? { href: action.href } : { onClick: action.onClick };

          return (
            <Component
              key={index}
              {...props}
              disabled={action.disabled}
              className="quick-action-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'transparent',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.5 : 1,
                textDecoration: 'none',
                transition: 'all 0.2s ease-out',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={(e: React.MouseEvent) => {
                if (!action.disabled) {
                  e.currentTarget.style.borderColor = '#6366F1';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                }
              }}
              onMouseLeave={(e: React.MouseEvent) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#FAFAFA',
                fontFamily: 'Outfit, sans-serif',
              }}>
                {action.loading ? 'Processing...' : action.label}
              </span>
              {action.loading ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  borderTop: '2px solid #6366F1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}/>
              ) : (
                <svg
                  style={{
                    width: '16px',
                    height: '16px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    transition: 'all 0.2s ease-out',
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </Component>
          );
        })}
      </div>

      {/* Priority Email Result */}
      {priorityResult && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: '10px',
          background: priorityResult.success
            ? 'rgba(34, 197, 94, 0.12)'
            : 'rgba(248, 113, 113, 0.12)',
          border: `1px solid ${priorityResult.success
            ? 'rgba(34, 197, 94, 0.3)'
            : 'rgba(248, 113, 113, 0.3)'}`,
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: priorityResult.success ? '#22C55E' : '#F87171',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {priorityResult.success ? '✓ Success' : '✕ Error'}
          </div>

          {priorityResult.success && priorityResult.result && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Found
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#FAFAFA', fontFamily: 'JetBrains Mono, monospace' }}>
                  {priorityResult.result.emailsFound}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Processed
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#FAFAFA', fontFamily: 'JetBrains Mono, monospace' }}>
                  {priorityResult.result.emailsProcessed}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Connections
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#FAFAFA', fontFamily: 'JetBrains Mono, monospace' }}>
                  {priorityResult.result.connectionsProcessed}
                </div>
              </div>
            </div>
          )}

          {priorityResult.error && (
            <div style={{ fontSize: '12px', color: '#F87171', fontFamily: 'Outfit, sans-serif' }}>
              {priorityResult.error}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});