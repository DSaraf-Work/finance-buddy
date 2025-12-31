import React, { memo } from 'react';

interface ReportCardProps {
  icon: string;
  label: string;
  value: string | number;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const ReportCard = memo(function ReportCard({
  icon,
  label,
  value,
  iconBg = 'rgba(99, 102, 241, 0.12)',
  trend,
}: ReportCardProps) {
  return (
    <div
      className="report-card"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '20px',
        transition: 'all 0.3s ease-out',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          background: iconBg,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}>
          {icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {label}
          </div>

          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#FAFAFA',
            fontFamily: 'JetBrains Mono, monospace',
            lineHeight: '1',
          }}>
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </div>

          {trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '8px',
            }}>
              <span style={{
                fontSize: '10px',
                color: trend.isPositive ? '#22C55E' : '#F87171',
              }}>
                {trend.isPositive ? '↑' : '↓'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: trend.isPositive ? '#22C55E' : '#F87171',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {Math.abs(trend.value)}%
              </span>
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.35)',
                fontFamily: 'Outfit, sans-serif',
              }}>
                vs last period
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});