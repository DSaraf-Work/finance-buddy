import React, { memo } from 'react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number | string;
  subtitle: string;
  loading?: boolean;
  hoverColor?: string;
}

export const StatCard = memo(function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
  loading = false,
  hoverColor = '#6366F1',
}: StatCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Card
      className="stat-card cursor-pointer transition-all duration-300 bg-card/50 border-border/50 hover:shadow-lg"
      style={{
        borderColor: isHovered ? hoverColor : undefined,
        boxShadow: isHovered ? `0 0 20px ${hoverColor}30` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{
            background: iconBg,
            color: iconColor,
          }}
        >
          {icon}
        </div>

        {/* Label */}
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {label}
        </div>

        {/* Value */}
        <div className="text-[32px] font-semibold text-foreground mb-1 font-mono leading-none">
          {loading ? (
            <span className="text-muted-foreground/50">—</span>
          ) : (
            typeof value === 'number' ? value.toLocaleString('en-IN') : value
          )}
        </div>

        {/* Subtitle */}
        <div className="text-[11px] font-normal text-muted-foreground/70">
          {subtitle}
        </div>
      </div>
    </Card>
  );
});