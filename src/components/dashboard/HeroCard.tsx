import React, { memo } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroCardProps {
  weeklySpending: number;
  lastWeekSpending: number;
  lastSyncTime: Date | null;
  onSync: () => void;
  syncing?: boolean;
  loading?: boolean;
}

export const HeroCard = memo(function HeroCard({
  weeklySpending,
  lastWeekSpending,
  lastSyncTime,
  onSync,
  syncing = false,
  loading = false,
}: HeroCardProps) {
  // Calculate percentage change
  const percentChange = lastWeekSpending > 0
    ? ((weeklySpending - lastWeekSpending) / lastWeekSpending) * 100
    : 0;

  const isIncrease = percentChange > 0;
  const absPercent = Math.abs(percentChange).toFixed(0);

  // Format last sync time
  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never synced';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      {/* Background gradient orb */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              This Week
            </p>
            <h2 className="text-sm text-muted-foreground/80">
              Your spending summary
            </h2>
          </div>

          {/* Sync button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={syncing}
            className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Spending amount */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold text-foreground font-mono tracking-tight">
                {loading ? (
                  <span className="text-muted-foreground/50">---</span>
                ) : (
                  <>₹{weeklySpending.toLocaleString('en-IN')}</>
                )}
              </span>
              <span className="text-lg text-muted-foreground/60">spent</span>
            </div>

            {/* Trend indicator */}
            {!loading && lastWeekSpending > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                    isIncrease
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}
                >
                  {isIncrease ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{absPercent}%</span>
                </div>
                <span className="text-xs text-muted-foreground/60">
                  vs last week
                </span>
              </div>
            )}
          </div>

          {/* Last sync info */}
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              Last sync: {formatLastSync(lastSyncTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
