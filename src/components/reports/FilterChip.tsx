import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    <Badge
      variant={active ? "default" : "outline"}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
        "hover:border-muted-foreground/20 hover:bg-muted/20",
        active && "hover:opacity-90"
      )}
      style={{
        borderColor: active ? color : undefined,
        backgroundColor: active ? `${color}15` : undefined,
        color: active ? color : undefined,
      }}
      onClick={onClick}
    >
      <span className={active ? "font-semibold" : "font-medium"}>
        {label}
      </span>
      {value !== undefined && (
        <span className="font-semibold font-mono">
          {value}
        </span>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-muted-foreground/10 hover:bg-muted-foreground/20 transition-colors"
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
    </Badge>
  );
});