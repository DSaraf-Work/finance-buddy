import { memo } from 'react';

interface TxnLoadingSkeletonProps {
  count?: number;
}

/**
 * Transaction Loading Skeleton Component
 * Matches /txn design spacing exactly
 */
const TxnLoadingSkeleton = memo(function TxnLoadingSkeleton({ count = 8 }: TxnLoadingSkeletonProps) {
  return (
    <div>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex items-center animate-pulse"
          style={{ padding: '16px 8px', gap: '14px' }}
        >
          {/* Icon skeleton - 48x48, borderRadius 14px */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)'
            }}
          />

          {/* Text content skeleton */}
          <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                height: '15px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '6px',
                width: '70%'
              }}
            />
            <div
              style={{
                height: '12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '4px',
                width: '45%'
              }}
            />
          </div>

          {/* Amount skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div
              style={{
                height: '15px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '6px',
                width: '72px'
              }}
            />
            <div
              style={{
                height: '11px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '4px',
                width: '48px'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

export default TxnLoadingSkeleton;
