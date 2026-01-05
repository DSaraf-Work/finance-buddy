import { memo, ReactNode } from 'react';

interface TxnListHeaderProps {
  title?: string;
  count: number;
  filterButton?: ReactNode;
}

/**
 * Transaction List Header Component
 * Shows filter button and count (title is now in Layout header)
 */
const TxnListHeader = memo(function TxnListHeader({ title, count, filterButton }: TxnListHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: title ? 'space-between' : 'flex-end',
        alignItems: 'center',
        marginBottom: '16px'
      }}
    >
      {/* Left side: Title (optional, for backwards compatibility) */}
      {title && (
        <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
          {title}
        </span>
      )}

      {/* Right side: Filter button and count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {filterButton}

        {/* listCount - 12px, rgba(255,255,255,0.35), 600, bg 0.06, padding 4px 10px, radius 8px */}
        <span
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.06)',
            padding: '4px 10px',
            borderRadius: '8px'
          }}
        >
          {count}
        </span>
      </div>
    </div>
  );
});

export default TxnListHeader;
