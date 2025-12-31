import React, { memo } from 'react';

export const ReportLoadingSkeleton = memo(function ReportLoadingSkeleton() {
  return (
    <div style={{ padding: '32px 20px' }}>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .skeleton {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.06) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 1000px 100%;
          border-radius: 12px;
        }
      `}</style>

      {/* Header Skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '20px', width: '400px' }} />
      </div>

      {/* Date Range Skeleton */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <div className="skeleton" style={{ height: '20px', width: '100px', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '16px' }}>
          <div className="skeleton" style={{ height: '40px' }} />
          <div className="skeleton" style={{ height: '40px' }} />
          <div className="skeleton" style={{ height: '40px' }} />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '12px' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '24px', width: '120px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '24px',
            }}
          >
            <div className="skeleton" style={{ height: '20px', width: '150px', marginBottom: '20px' }} />
            {[1, 2, 3, 4].map((j) => (
              <div key={j} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="skeleton" style={{ height: '14px', width: '100px' }} />
                  <div className="skeleton" style={{ height: '6px', flex: 1 }} />
                  <div className="skeleton" style={{ height: '14px', width: '60px' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '24px',
      }}>
        <div className="skeleton" style={{ height: '20px', width: '200px', marginBottom: '20px' }} />
        <div>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '16px',
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: '14px' }} />
            ))}
          </div>
          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: '16px',
                padding: '12px 0',
              }}
            >
              {[1, 2, 3, 4].map((col) => (
                <div key={col} className="skeleton" style={{ height: '16px' }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});