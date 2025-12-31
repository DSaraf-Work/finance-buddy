import React, { memo } from 'react';

interface FilterChipProps {
  label: string;
  value?: string | number;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  color?: string;
}

export const FilterChip = memo(function FilterChip({
  label,
  value,
  active = false,
  onClick,
  onRemove,
  color = '#6366F1',
}: FilterChipProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '10px',
        border: `1px solid ${active ? color : 'rgba(255, 255, 255, 0.08)'}`,
        background: active ? `${color}15` : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-out',
        fontFamily: 'Outfit, sans-serif',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick && !active) {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !active) {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <span style={{
        fontSize: '12px',
        fontWeight: active ? '600' : '500',
        color: active ? color : 'rgba(255, 255, 255, 0.7)',
      }}>
        {label}
      </span>
      {value !== undefined && (
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: active ? color : 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {value}
        </span>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'background 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L9 9M9 1L1 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
});