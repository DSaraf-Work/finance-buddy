import { memo } from 'react';

interface TxnListHeaderProps {
  title: string;
  count: number;
}

/**
 * Transaction List Header Component
 * Matches /txn design specifications
 */
const TxnListHeader = memo(function TxnListHeader({ title, count }: TxnListHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}
    >
      {/* listTitle - 15px, 600, rgba(255,255,255,0.9) */}
      <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
        {title}
      </span>

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
  );
});

export default TxnListHeader;
