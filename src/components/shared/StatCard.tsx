import React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  iconClassName?: string;
  secondaryLabel?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  iconClassName,
  secondaryLabel,
  className
}) => {
  return (
    <Card className={cn("flex flex-col justify-between h-full group", className)} padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[var(--muted-foreground)] font-bold text-xs uppercase tracking-widest leading-none">{title}</h3>
        <div className={cn(
          "p-2.5 rounded-2xl transition-all group-hover:scale-110",
          iconClassName || "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        )}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-foreground tracking-tight">{value}</span>
        {unit && <span className="text-[var(--muted-foreground)] font-bold text-sm">{unit}</span>}
      </div>
      {secondaryLabel && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-tighter italic">{secondaryLabel}</p>
        </div>
      )}
    </Card>
  );
};
