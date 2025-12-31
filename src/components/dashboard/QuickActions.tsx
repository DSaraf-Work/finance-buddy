import React, { memo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface QuickAction {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  priorityResult?: any;
}

export const QuickActions = memo(function QuickActions({ actions, priorityResult }: QuickActionsProps) {
  return (
    <Card className="bg-card/50 border-border/50 p-6">
      {/* Header */}
      <div className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-5">
        Quick Actions
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {actions.map((action, index) => {
          if (action.href) {
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3.5 px-4 border-border/50 hover:bg-primary/10 hover:border-primary"
                  disabled={action.disabled}
                >
                  <span className="text-sm font-medium">
                    {action.loading ? 'Processing...' : action.label}
                  </span>
                  {action.loading ? (
                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </Link>
            );
          }

          return (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-between h-auto py-3.5 px-4 border-border/50 hover:bg-primary/10 hover:border-primary"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <span className="text-sm font-medium">
                {action.loading ? 'Processing...' : action.label}
              </span>
              {action.loading ? (
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Priority Email Result */}
      {priorityResult && (
        <div
          className={`mt-5 p-4 rounded-[10px] ${
            priorityResult.success
              ? 'bg-success/10 border border-success/30'
              : 'bg-destructive/10 border border-destructive/30'
          }`}
        >
          <div
            className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${
              priorityResult.success ? 'text-success' : 'text-destructive'
            }`}
          >
            {priorityResult.success ? '✓ Success' : '✕ Error'}
          </div>

          {priorityResult.success && priorityResult.result && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-muted-foreground">Found</div>
                <div className="text-lg font-semibold text-foreground font-mono">
                  {priorityResult.result.emailsFound}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Processed</div>
                <div className="text-lg font-semibold text-foreground font-mono">
                  {priorityResult.result.emailsProcessed}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Connections</div>
                <div className="text-lg font-semibold text-foreground font-mono">
                  {priorityResult.result.connectionsProcessed}
                </div>
              </div>
            </div>
          )}

          {priorityResult.error && (
            <div className="text-xs text-destructive">
              {priorityResult.error}
            </div>
          )}
        </div>
      )}
    </Card>
  );
});