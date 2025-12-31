import React, { memo } from 'react';

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onApply?: () => void;
}

export const DateRangePicker = memo(function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
}: DateRangePickerProps) {
  const quickRanges = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  const setQuickRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    onFromChange(startDate.toISOString().split('T')[0]);
    onToChange(endDate.toISOString().split('T')[0]);
    if (onApply) onApply();
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '14px',
      padding: '24px',
    }}>
      <h3 style={{
        fontSize: '15px',
        fontWeight: '600',
        color: '#FAFAFA',
        marginBottom: '20px',
        fontFamily: 'Outfit, sans-serif',
      }}>
        Date Range
      </h3>

      {/* Quick Range Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        {quickRanges.map((range) => (
          <button
            key={range.label}
            onClick={() => setQuickRange(range.days)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366F1';
              e.currentTarget.style.color = '#6366F1';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Date Inputs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: onApply ? '1fr 1fr 120px' : '1fr 1fr',
        gap: '16px',
        alignItems: 'end',
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: 'Outfit, sans-serif',
          }}>
            From Date
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              color: '#FAFAFA',
              fontSize: '14px',
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
              transition: 'all 0.2s ease-out',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366F1';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: 'Outfit, sans-serif',
          }}>
            To Date
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              color: '#FAFAFA',
              fontSize: '14px',
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
              transition: 'all 0.2s ease-out',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366F1';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
          />
        </div>

        {onApply && (
          <button
            onClick={onApply}
            style={{
              padding: '10px 20px',
              background: '#6366F1',
              border: 'none',
              borderRadius: '10px',
              color: '#FAFAFA',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
              transition: 'opacity 0.2s ease-out',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
});