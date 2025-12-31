import React, { memo } from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number | string;
  subtitle: string;
  loading?: boolean;
  hoverColor?: string;
}

export const StatCard = memo(function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
  loading = false,
  hoverColor = '#6366F1',
}: StatCardProps) {
  return (
    <div
      className="dashboard-card stat-card"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '24px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverColor;
        e.currentTarget.style.boxShadow = `0 0 20px ${hoverColor}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Icon */}
      <div style={{
        width: '48px',
        height: '48px',
        background: iconBg,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        color: iconColor,
      }}>
        {icon}
      </div>

      {/* Label */}
      <div style={{
        fontSize: '11px',
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px',
        fontFamily: 'Outfit, sans-serif',
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '32px',
        fontWeight: '600',
        color: '#FAFAFA',
        marginBottom: '4px',
        fontFamily: 'JetBrains Mono, monospace',
        lineHeight: '1',
      }}>
        {loading ? (
          <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>—</span>
        ) : (
          typeof value === 'number' ? value.toLocaleString('en-IN') : value
        )}
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: '11px',
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.35)',
        fontFamily: 'Outfit, sans-serif',
      }}>
        {subtitle}
      </div>
    </div>
  );
});