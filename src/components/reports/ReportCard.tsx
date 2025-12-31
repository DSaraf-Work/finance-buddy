import React, { memo } from 'react';
import { Card } from '@/components/ui/card';

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
    <Card className="report-card p-5 cursor-pointer transition-all duration-300 bg-card/50 border-border/50 hover:-translate-y-0.5 hover:border-muted-foreground/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>

        <div className="flex-1">
          <div className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">
            {label}
          </div>

          <div className="text-2xl font-semibold text-foreground font-mono leading-none">
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </div>

          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-[10px] ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.isPositive ? '↑' : '↓'}
              </span>
              <span className={`text-[11px] font-medium font-mono ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-[11px] text-muted-foreground/35">
                vs last period
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});