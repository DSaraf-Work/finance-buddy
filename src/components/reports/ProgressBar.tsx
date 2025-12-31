import React, { memo } from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color?: string;
  showPercentage?: boolean;
  suffix?: string;
}

export const ProgressBar = memo(function ProgressBar({
  label,
  value,
  total,
  color = '#6366F1',
  showPercentage = true,
  suffix,
}: ProgressBarProps) {
  const percentage = Math.round((value / total) * 100);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: '1',
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.7)',
          minWidth: '120px',
          fontFamily: 'Outfit, sans-serif',
        }}>
          {label}
        </span>

        <div style={{
          flex: '1',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '3px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div
            style={{
              height: '100%',
              background: color,
              borderRadius: '3px',
              width: `${percentage}%`,
              transition: 'width 0.35s ease-out',
              boxShadow: `0 0 10px ${color}40`,
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginLeft: '16px',
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#FAFAFA',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {value.toLocaleString('en-IN')}
        </span>
        {suffix && (
          <span style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {suffix}
          </span>
        )}
        {showPercentage && (
          <span style={{
            fontSize: '11px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.35)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            ({percentage}%)
          </span>
        )}
      </div>
    </div>
  );
});